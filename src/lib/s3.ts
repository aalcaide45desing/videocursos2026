import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cliente S3 configurado para MEGA S4 (S3-compatible).
 *
 * IMPORTANTE: Este archivo solo se importa en Server Components y API Routes.
 * NUNCA en archivos con 'use client'. Las credenciales NUNCA se exponen al cliente.
 *
 * El S3Client se instancia en cada invocación serverless (stateless por diseño).
 * AWS SDK v3 es modular — solo se importa lo necesario.
 */
export const s3Client = new S3Client({
  endpoint: process.env.MEGA_S4_ENDPOINT!,       // https://s3.eu-central-1.s4.mega.io
  region: process.env.MEGA_S4_REGION!,           // eu-central-1
  credentials: {
    accessKeyId: process.env.MEGA_S4_ACCESS_KEY!,
    secretAccessKey: process.env.MEGA_S4_SECRET_KEY!,
  },
  forcePathStyle: true, // Requerido por MEGA S4 para resolución de bucket
});

export const MEGA_S4_BUCKET = process.env.MEGA_S4_BUCKET!;
