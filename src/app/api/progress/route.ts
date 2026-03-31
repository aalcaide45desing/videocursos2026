import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { lessonProgress, lessons } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();

    const lessonId = body.lessonId as string;
    const lastPositionSeconds = body.lastPositionSeconds as number;
    let completed = body.completed as boolean | undefined;

    if (!lessonId || lastPositionSeconds === undefined) {
      return new NextResponse('Campos obligatorios faltantes', { status: 400 });
    }

    // Verificar si la lección existe antes de intentar guardar el progreso.
    // Opcionalmente se puede optimizar omitiendo esta db call si el frontend siempre manda data válida.
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) {
      return new NextResponse('Lección no encontrada', { status: 404 });
    }

    // Determinar si ya deberíamos marcarlo como completado 
    // (Ejemplo: si ha visto más del 90% pero el frontend no lo mapeó)
    if (lesson.durationSeconds && lastPositionSeconds >= lesson.durationSeconds * 0.9) {
      completed = true;
    }

    // Upsert (insert or update)
    await db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        lastPositionSeconds,
        completed: completed || false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          lastPositionSeconds,
          completed: completed || false,
          updatedAt: new Date(),
        },
      });

    return new NextResponse('Progreso guardado', { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('No autenticado', { status: 401 });
    }
    console.error('[API_PROGRESS]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
