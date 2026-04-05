import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { isProfesor, getDbUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const isProfOrAdmin = await isProfesor();
  if (!isProfOrAdmin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const user = await currentUser();
    const dbUser = await getDbUser(user!.id);
    
    const body = await req.json();
    const { title, description, price, thumbnailUrl, checkoutUrl, isPublished } = body;

    if (!title?.trim()) {
      return new NextResponse('El título es obligatorio', { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const [newCourse] = await db.insert(courses).values({
      title: title.trim(),
      slug,
      description: description?.trim() ?? '',
      price: price ? String(price) : '0',
      thumbnailUrl: thumbnailUrl?.trim() || null,
      checkoutUrl: checkoutUrl?.trim() || null,
      isPublished: isPublished ?? false,
      instructorId: user!.id,
    }).returning();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return new NextResponse('Ya existe un curso con ese título', { status: 409 });
    }
    console.error('[API_ADMIN_COURSES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isProfOrAdmin = await isProfesor();
  if (!isProfOrAdmin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const user = await currentUser();
    const dbUser = await getDbUser(user!.id);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new NextResponse('ID requerido', { status: 400 });

    // Validate ownership if professor
    if (dbUser?.role === 'profesor') {
      const [existing] = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.instructorId, user!.id)));
      if (!existing) return new NextResponse('Forbidden: No eres el dueño de este curso', { status: 403 });
    }

    const body = await req.json();
    const { title, description, price, thumbnailUrl, checkoutUrl, isPublished } = body;

    const [updated] = await db.update(courses)
      .set({
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price !== undefined && { price: String(price) }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl?.trim() || null }),
        ...(checkoutUrl !== undefined && { checkoutUrl: checkoutUrl?.trim() || null }),
        ...(isPublished !== undefined && { isPublished }),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API_ADMIN_COURSES_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
