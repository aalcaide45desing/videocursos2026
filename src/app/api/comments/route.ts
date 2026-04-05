import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getDbUser } from '@/lib/auth';
import { db } from '@/db';
import { comments, userCourseAccess, lessons, courses } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// Obtener comentarios de una lección
export async function GET(req: NextRequest) {
  try {
    const lessonId = req.nextUrl.searchParams.get('lessonId');
    if (!lessonId) return new NextResponse('El ID de la lección es obligatorio', { status: 400 });

    // En un sistema real grande esto se puede filtrar por isApproved. 
    // De momento traemos todos para que el front lo gestione según roles.
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
            role: true,
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

// Crear comentario
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const user = await getDbUser(userId);
    if (!user) return new NextResponse('Usuario no encontrado', { status: 404 });

    const body = await req.json();
    const { lessonId, content, parentId } = body;

    if (!lessonId || !content) {
      return new NextResponse('Faltan campos obligatorios', { status: 400 });
    }

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) return new NextResponse('Lección no encontrada', { status: 404 });

    // Validar acceso si no es gratis y no es admin
    if (!lesson.isFree && user.role !== 'admin') {
      const [course] = await db.select().from(courses).where(eq(courses.id, lesson.courseId));
      const isInstructor = user.role === 'profesor' && course?.instructorId === userId;

      if (!isInstructor) {
        const [access] = await db
          .select()
          .from(userCourseAccess)
          .where(and(eq(userCourseAccess.userId, userId), eq(userCourseAccess.courseId, lesson.courseId)));

        if (!access) return new NextResponse('No tienes acceso para comentar aquí', { status: 403 });
      }
    }

    // Profesores y admin aprueban automáticamente. Los demás necesitan moderación.
    const isAutoApproved = user.role === 'admin' || user.role === 'profesor';

    const [newComment] = await db
      .insert(comments)
      .values({
        lessonId,
        userId,
        content,
        parentId: parentId || null,
        status: isAutoApproved ? 'approved' : 'pending_moderation',
      })
      .returning();

    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    console.error('[API_COMMENTS_POST]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

// Editar comentario o Aprobarlo
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const user = await getDbUser(userId);
    if (!user) return new NextResponse('Usuario no encontrado', { status: 404 });

    const body = await req.json();
    const { commentId, newContent, newStatus } = body;

    if (!commentId) return new NextResponse('ID requerido', { status: 400 });

    const [existing] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!existing) return new NextResponse('No encontrado', { status: 404 });

    const isAdminOrProf = user.role === 'admin' || user.role === 'profesor';

    let contentToUpdate = existing.content;
    let statusToUpdate = existing.status;

    // Acción: Editar contenido (Solo el autor dentro de 5 min)
    if (newContent) {
      if (existing.userId !== userId) {
        return new NextResponse('No autorizado', { status: 403 });
      }
      
      const isWithinGracePeriod = Date.now() - new Date(existing.createdAt).getTime() < 5 * 60 * 1000;
      if (!isWithinGracePeriod) {
        return new NextResponse('El tiempo de edición ha expirado', { status: 403 });
      }
      contentToUpdate = newContent;
      // Reseteamos status porque ha cambiado y hay que volver a moderar
      if (!isAdminOrProf) statusToUpdate = 'pending_moderation';
    }

    // Acción: Aprobar/Rechazar (Solo admin o profesor)
    if (newStatus && isAdminOrProf) {
      statusToUpdate = newStatus;
    }

    const [updated] = await db
      .update(comments)
      .set({ content: contentToUpdate, status: statusToUpdate, updatedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API_COMMENTS_PATCH]', err);
    return new NextResponse('Error interno', { status: 500 });
  }
}
