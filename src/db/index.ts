import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Cliente Drizzle ORM con driver HTTP de Neon (stateless).
 * 
 * Se usa neon-http (HTTP-based) en lugar de neon-serverless (WebSocket)
 * porque es más compatible con Vercel Serverless Functions donde cada
 * invocación es efímera. No se necesitan connection pools.
 * 
 * IMPORTANTE: Solo importar en Server Components y API Routes.
 * Nunca en archivos con 'use client'.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
