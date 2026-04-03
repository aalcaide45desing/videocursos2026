import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { lessons, userCourseAccess, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getObjectText } from '@/lib/presigned';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const lessonId = req.nextUrl.searchParams.get('lessonId');

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    // Auto-sincronizar usuario de Clerk con la BD si no existe aún
    // (el webhook de Clerk puede no estar configurado en local)
    const { syncClerkUser } = await import('@/lib/auth');
    await syncClerkUser(userId);

    // Volver a leer el usuario (ya existe tras el upsert)
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.isSuspended) {
      return new NextResponse('Account suspended', { status: 403 });
    }

    const now = new Date();
    const RESET_WINDOW_MS = 5 * 60 * 1000;
    const MAX_REQUESTS = 50;
    let newCount = user.manifestRequestsCount + 1;
    let newReset = user.manifestRequestsLastReset;
    if (!newReset || now.getTime() - newReset.getTime() > RESET_WINDOW_MS) {
      newCount = 1;
      newReset = now;
    }
    if (newCount > MAX_REQUESTS) {
      await db.update(users).set({ isSuspended: true }).where(eq(users.id, userId));
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
    db.update(users)
      .set({ manifestRequestsCount: newCount, manifestRequestsLastReset: newReset })
      .where(eq(users.id, userId)).execute();

    // Obtener lección
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) return new NextResponse('Lesson not found', { status: 404 });
    if (!lesson.megaS4MasterPath) return new NextResponse('No video content', { status: 404 });

    // Verificar acceso (admins pasan siempre)
    const isUserAdmin = await isAdmin();
    if (!lesson.isFree && !isUserAdmin) {
      const [access] = await db.select().from(userCourseAccess).where(
        and(eq(userCourseAccess.userId, userId), eq(userCourseAccess.courseId, lesson.courseId))
      );
      if (!access) return new NextResponse('No access', { status: 403 });
    }

    // Descargar master.m3u8 con credenciales desde MEGA S4
    const masterKey = lesson.megaS4MasterPath.replace(/^\/+/, '');
    const masterContent = await getObjectText(masterKey);

    // Calcular directorio base (para resolver rutas relativas de variantes)
    const baseDir = masterKey.substring(0, masterKey.lastIndexOf('/') + 1);

    // URL base de nuestra app para construir URLs internas del proxy de playlists
    const origin = req.nextUrl.origin; // ej: http://localhost:3000 o https://tudominio.com

    // Reescribir rutas de variantes y FILTRAR las problemáticas (AV1 en .ts da pantalla negra en Chrome)
    const lines = masterContent.split('\n');
    const rewrittenLines: string[] = [];
    
    let isSkipping = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Si la línea indica que es un stream AV1 (ej. CODECS="av01..."), nos saltamos esta y la siguiente (la URL)
      if (trimmed.startsWith('#EXT-X-STREAM-INF') && trimmed.includes('av01')) {
        isSkipping = true;
        continue;
      }

      if (isSkipping && !trimmed.startsWith('#')) {
        // Esta es la URL del stream AV1, nos la saltamos y reseteamos la flag
        isSkipping = false;
        continue;
      }

      // Si no hay que saltarla
      if (!trimmed || trimmed.startsWith('#')) {
        rewrittenLines.push(line);
        continue;
      }

      // Es una variante válida (H.264), calculamos su URL de proxy
      const variantKey = trimmed.startsWith('http') ? trimmed : `${baseDir}${trimmed}`;
      rewrittenLines.push(`${origin}/api/video/playlist?key=${encodeURIComponent(variantKey)}`);
    }

    const rewrittenMaster = rewrittenLines.join('\n');

    return new NextResponse(rewrittenMaster, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('Unauthenticated', { status: 401 });
    }
    console.error('[API_VIDEO_MANIFEST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
