import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { privateNotes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const lessonId = req.nextUrl.searchParams.get('lessonId');

    if (!lessonId) return new NextResponse('Missing lessonId', { status: 400 });

    const notes = await db.query.privateNotes.findMany({
      where: and(
        eq(privateNotes.userId, userId),
        eq(privateNotes.lessonId, lessonId)
      ),
      orderBy: (notes, { asc }) => [asc(notes.timestampSeconds)],
    });

    return NextResponse.json(notes);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { lessonId, content, timestampSeconds } = await req.json();

    if (!lessonId || !content) return new NextResponse('Missing fields', { status: 400 });

    const [note] = await db.insert(privateNotes).values({
      lessonId,
      userId,
      content,
      timestampSeconds: timestampSeconds || 0,
    }).returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { id, content } = await req.json();

    if (!id || !content) return new NextResponse('Missing fields', { status: 400 });

    const [updated] = await db.update(privateNotes)
      .set({ content })
      .where(and(eq(privateNotes.id, id), eq(privateNotes.userId, userId)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const id = req.nextUrl.searchParams.get('id');

    if (!id) return new NextResponse('Missing id', { status: 400 });

    await db.delete(privateNotes).where(and(eq(privateNotes.id, id), eq(privateNotes.userId, userId)));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
