import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';

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
 * Comprueba si el usuario autenticado tiene el rol 'admin'
 * (via Clerk publicMetadata.role).
 */
export async function isAdmin(): Promise<boolean> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin';
}
