import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons } from '@/db/schema';
import { isAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// POST /api/admin/lessons — crear nueva lección en un curso
export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const body = await req.json();
    const { courseId, title, megaS4MasterPath, durationSeconds, isFree, order } = body;

    if (!courseId?.trim() || !title?.trim()) {
      return new NextResponse('courseId y título son obligatorios', { status: 400 });
    }

    const [newLesson] = await db.insert(lessons).values({
      courseId,
      title: title.trim(),
      megaS4MasterPath: megaS4MasterPath?.trim() ?? '',
      durationSeconds: durationSeconds ? Number(durationSeconds) : null,
      isFree: isFree ?? false,
      order: order ?? 0,
    }).returning();

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error) {
    console.error('[API_ADMIN_LESSONS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/admin/lessons?id=xxx — editar lección
export async function PATCH(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new NextResponse('ID requerido', { status: 400 });

    const body = await req.json();
    const { title, megaS4MasterPath, durationSeconds, isFree, order } = body;

    const [updated] = await db.update(lessons)
      .set({
        ...(title && { title: title.trim() }),
        ...(megaS4MasterPath !== undefined && { megaS4MasterPath: megaS4MasterPath.trim() }),
        ...(durationSeconds !== undefined && { durationSeconds: durationSeconds ? Number(durationSeconds) : null }),
        ...(isFree !== undefined && { isFree }),
        ...(order !== undefined && { order: Number(order) }),
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API_ADMIN_LESSONS_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/lessons?id=xxx


export async function DELETE(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return new NextResponse('Forbidden', { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse('ID requerido', { status: 400 });

  await db.delete(lessons).where(eq(lessons.id, id));
  return NextResponse.json({ success: true });
}
