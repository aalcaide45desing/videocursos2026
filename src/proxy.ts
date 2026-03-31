import {
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Rutas públicas — accesibles sin autenticación.
 * Todo lo demás es privado por defecto.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/cursos(.*)',      // Catálogo y páginas de detalle públicas
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Hotmart webhook (no requiere sesión Clerk)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Excluir archivos estáticos de Next.js y _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
    '/(api|trpc)(.*)',
  ],
};
