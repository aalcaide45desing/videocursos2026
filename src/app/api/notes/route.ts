import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { privateNotes } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const lessonId = req.nextUrl.searchParams.get('lessonId');

    if (!lessonId) {
      return new NextResponse('El ID de la lección es obligatorio', { status: 400 });
    }

    // Las notas son 100% privadas. Solo sacamos las del usuario logueado.
    // Ordenadas por el minuto en el que ocurren en el vídeo de menor a mayor.
    const notes = await db.query.privateNotes.findMany({
      where: and(
        eq(privateNotes.lessonId, lessonId),
        eq(privateNotes.userId, userId)
      ),
      orderBy: [asc(privateNotes.timestampSeconds)],
    });

    return NextResponse.json(notes);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('No autenticado', { status: 401 });
    }
    console.error('[API_NOTES_GET]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { lessonId, content, timestampSeconds } = body;

    if (!lessonId || !content || timestampSeconds === undefined) {
      return new NextResponse('Faltan campos obligatorios', { status: 400 });
    }

    // Insertar la nota con su marca de tiempo exacta
    const [newNote] = await db
      .insert(privateNotes)
      .values({
        lessonId,
        userId,
        content,
        timestampSeconds,
      })
      .returning();

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('No autenticado', { status: 401 });
    }
    console.error('[API_NOTES_POST]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const noteId = req.nextUrl.searchParams.get('id');

    if (!noteId) {
      return new NextResponse('Falta el ID de la nota', { status: 400 });
    }

    // Borrar asegurándose de que la nota pertenezca a este usuario (seguridad extra)
    await db
      .delete(privateNotes)
      .where(and(eq(privateNotes.id, noteId), eq(privateNotes.userId, userId)));

    return new NextResponse('Nota borrada', { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('No autenticado', { status: 401 });
    }
    console.error('[API_NOTES_DELETE]', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
