import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { comments, userCourseAccess, lessons } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const lessonId = req.nextUrl.searchParams.get('lessonId');
    if (!lessonId) {
      return new NextResponse('El ID de la lección es obligatorio', { status: 400 });
    }

    // Consulta con join a users para sacar el nombre y avatar
    const lessonComments = await db.query.comments.findMany({
      where: eq(comments.lessonId, lessonId),
      orderBy: [desc(comments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(lessonComments);
  } catch (error) {
    console.error('[API_COMMENTS_GET]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { lessonId, content } = body;

    if (!lessonId || !content) {
      return new NextResponse('Faltan campos obligatorios', { status: 400 });
    }

    // Seguridad: verificar que el usuario tenga acceso al curso de esta lección
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) {
      return new NextResponse('Lección no encontrada', { status: 404 });
    }

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
        return new NextResponse('No tienes acceso para comentar aquí', { status: 403 });
      }
    }

    // Insertar el nuevo comentario
    const [newComment] = await db
      .insert(comments)
      .values({
        lessonId,
        userId,
        content,
      })
      .returning();

    // Buscar los detalles del usuario para devolverlos y pintar el comentario en vivo
    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('No autenticado', { status: 401 });
    }
    console.error('[API_COMMENTS_POST]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
