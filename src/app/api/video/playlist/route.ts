import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getObjectText, generatePresignedUrl } from '@/lib/presigned';

/**
 * GET /api/video/playlist?key=curso-prueba/leccion-1/720p/playlist.m3u8
 *
 * Proxy que descarga una playlist de variante HLS desde MEGA S4 (server-side)
 * y reescribe cada segmento .ts con una URL presignada para que hls.js
 * pueda acceder sin credenciales desde el navegador.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // Garantizar que el usuario está autenticado

    const key = req.nextUrl.searchParams.get('key');
    if (!key) return new NextResponse('Key required', { status: 400 });

    // Descargar la playlist de variante con credenciales
    const playlistContent = await getObjectText(key);

    // La base es el directorio del archivo playlist (para resolver rutas relativas de .ts)
    const baseDir = key.substring(0, key.lastIndexOf('/') + 1);

    const lines = playlistContent.split('\n');
    const rewritten = await Promise.all(
      lines.map(async (line) => {
        const trimmed = line.trim();
        // Ignorar comentarios y líneas vacías
        if (!trimmed || trimmed.startsWith('#')) return line;

        // Es un segmento (ej: "seg-001.ts" o "0001.ts")
        const segKey = trimmed.startsWith('http') ? trimmed : `${baseDir}${trimmed}`;
        // Generar presigned URL para el segmento (30 min de validez)
        const signed = await generatePresignedUrl(segKey, 1800);
        return signed;
      })
    );

    return new NextResponse(rewritten.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return new NextResponse('Unauthenticated', { status: 401 });
    }
    console.error('[API_VIDEO_PLAYLIST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
