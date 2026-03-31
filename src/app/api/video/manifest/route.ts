import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { lessons, userCourseAccess, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePresignedUrl, getObjectText } from '@/lib/presigned';

export async function GET(req: NextRequest) {
  try {
    // 1. Verificaciones de seguridad: Auth y Rate Limite (TODO Phase 5)
    const { userId } = await requireAuth();
    const lessonId = req.nextUrl.searchParams.get('lessonId');

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    // 2. Verificar que el usuario no está suspendido
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.isSuspended) {
      return new NextResponse('Account suspended due to unusual activity', { status: 403 });
    }

    // 3. Obtener la lección y comprobar el acceso al curso
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));

    if (!lesson) {
      return new NextResponse('Lesson not found', { status: 404 });
    }

    // Comprobar que el usuario ha comprado el curso o que la lección es gratis
    if (!lesson.isFree) {
      const [access] = await db
        .select()
        .from(userCourseAccess)
        .where(
          and(
            eq(userCourseAccess.userId, userId),
            eq(userCourseAccess.courseId, lesson.courseId)
          )
        );

      if (!access) {
        return new NextResponse('No access to this course', { status: 403 });
      }
    }

    // 4. Si pasamos la seguridad, descargamos el manifest original desde MEGA S4 server-side
    // El manifest es público/protegido a nivel carpeta en S3 pero evitamos que el user lo vea crudo.
    if (!lesson.megaS4MasterPath) {
      return new NextResponse('Video content not uploaded yet', { status: 404 });
    }

    const masterHls = await getObjectText(lesson.megaS4MasterPath);

    // 5. Reescribimos el manifest. 
    // Por cada variante (.m3u8 de resoluciones), generaremos una Presigned URL.
    const basePath = lesson.megaS4MasterPath.substring(
      0,
      lesson.megaS4MasterPath.lastIndexOf('/') + 1
    );

    const lines = masterHls.split('\n');
    const rewrittenLines = await Promise.all(
      lines.map(async (line) => {
        const trimmed = line.trim();
        // Si no es un comentario ni está vacío, es una ruta de playlist (ej: "1080p/playlist.m3u8")
        if (trimmed && !trimmed.startsWith('#')) {
          const variantKey = `${basePath}${trimmed}`;
          return await generatePresignedUrl(variantKey, 1800); // 30 mins (1800s) expiración para renovar
        }
        return line;
      })
    );

    const newHlsContent = rewrittenLines.join('\n');

    return new NextResponse(newHlsContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        // Evitamos que el navegador cachee el manifiesto protegido que expira rápido
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
