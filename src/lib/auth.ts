import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Obtiene el userId autenticado. Lanza error si no hay sesión.
 * Usar en Server Components y API Routes.
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autenticado');
  return { userId };
}

/**
 * Sincroniza el usuario de Clerk con la tabla `users` de Neon.
 * Crea el registro si no existe (upsert por id).
 * Llamar desde el webhook de Clerk o en el primer acceso al dashboard.
 */
export async function syncClerkUser(clerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

  await db
    .insert(users)
    .values({
      id: clerkUserId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
      role: 'registrado', // Default role
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      },
    });
}

/**
 * Obtiene el registro completo del usuario desde la base de datos.
 */
export async function getDbUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user || null;
}

/**
 * Comprueba si el usuario autenticado tiene el rol 'admin' en la base de datos (o fallback Clerk).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  if (user.publicMetadata?.role === 'admin') return true;

  const dbUser = await getDbUser(user.id);
  return dbUser?.role === 'admin';
}

/**
 * Comprueba si el usuario autenticado tiene el rol 'profesor' o 'admin' en la base de datos.
 */
export async function isProfesor(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  if (user.publicMetadata?.role === 'admin' || user.publicMetadata?.role === 'profesor') return true;

  const dbUser = await getDbUser(user.id);
  return dbUser?.role === 'admin' || dbUser?.role === 'profesor';
}
