import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, MEGA_S4_BUCKET } from './s3';

/**
 * Genera una presigned URL para un objeto en MEGA S4.
 * La URL expira en `expiresIn` segundos (default: 5 minutos).
 *
 * SOLO llamar desde Server Components o API Routes.
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: MEGA_S4_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Obtiene el contenido de texto de un objeto en MEGA S4 (ej: un .m3u8).
 * Devuelve el body como string.
 */
export async function getObjectText(key: string): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const command = new GetObjectCommand({
    Bucket: MEGA_S4_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) throw new Error(`Objeto vacío en MEGA S4: ${key}`);

  return response.Body.transformToString('utf-8');
}
