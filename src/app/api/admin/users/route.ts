import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    if (!(await isAdmin())) return NextResponse.json('No autorizado', { status: 403 });

    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    return NextResponse.json('Error de red', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    if (!(await isAdmin())) return NextResponse.json('No autorizado', { status: 403 });

    const { targetUserId, newRole } = await request.json();
    if (!targetUserId || !newRole) return NextResponse.json('Faltan datos', { status: 400 });

    const [updatedUser] = await db
      .update(users)
      .set({ role: newRole })
      .where(eq(users.id, targetUserId))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json('Error al actualizar el usuario', { status: 500 });
  }
}
