#!/usr/bin/env bash
# =============================================================================
# encode_course.sh — Transcodificación H.264 NVENC + HLS + Thumbnail WebP
# =============================================================================
# Plataforma: LMS Videocursos 2026
# Hardware:   NVIDIA GPU (h264_nvenc) + H.264 Máxima Compatibilidad Web
#
# USO:
#   ./encode_course.sh "video_entrada.mp4" "slug-del-curso" "01-titulo-leccion"
#
# EJEMPLO:
#   ./encode_course.sh "grabacion.mp4" "blender-desde-cero" "01-introduccion"
#
# NOTA IMPORTANTE DE COMPATIBILIDAD WEB:
# Los navegadores web (Chrome, Edge, Safari) NO soportan reproducir AV1
# empaquetado dentro de fragmentos .ts. Esto produce el error de "Pantalla Negra
# con audio". Por eso, este script ha sido reescrito para empaquetar en H.264
# que tiene 100% de compatibilidad garantizada en todos los navegadores y móviles.
# =============================================================================

set -euo pipefail

# =============================================================================
# ARGUMENTOS
# =============================================================================
INPUT="${1:-}"
COURSE_SLUG="${2:-}"
LESSON_SLUG="${3:-}"

if [[ -z "$INPUT" || -z "$COURSE_SLUG" || -z "$LESSON_SLUG" ]]; then
  echo "❌ USO: $0 <video_entrada> <slug-curso> <slug-leccion>"
  echo "   Ejemplo: $0 leccion1.mp4 blender-desde-cero 01-introduccion"
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "❌ Archivo de entrada no encontrado: $INPUT"
  exit 1
fi

# =============================================================================
# CONFIGURACIÓN
# =============================================================================
OUTPUT_DIR="./output/${COURSE_SLUG}/${LESSON_SLUG}"
THUMB_DIR="${OUTPUT_DIR}/thumbnails"
HLS_TIME=4

# GOP para 24fps y 30fps (2 segundos de intervalo de keyframe)
DETECT_FPS=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=r_frame_rate \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT" | bc -l)
FPS_ROUNDED=$(printf "%.0f" "$DETECT_FPS")
GOP=$(( FPS_ROUNDED * 2 ))

echo "============================================================"
echo " LMS Videocursos 2026 — Transcodificación H.264 HLS"
echo " (100% Compatibilidad Web garantizada sin pantalla negra)"
echo "============================================================"
echo " Entrada:      $INPUT"
echo " Curso:        $COURSE_SLUG"
echo " Lección:      $LESSON_SLUG"
echo " FPS detectado: ${FPS_ROUNDED} (GOP=${GOP})"
echo " Salida:       $OUTPUT_DIR"
echo "============================================================"

# Crear directorios
mkdir -p "${OUTPUT_DIR}/4k" "${OUTPUT_DIR}/1080p" "${OUTPUT_DIR}/720p" "${OUTPUT_DIR}/480p" \
  "${OUTPUT_DIR}/subtitles" "${OUTPUT_DIR}/resources" "${THUMB_DIR}"

# =============================================================================
# PASO 1: THUMBNAILS
# =============================================================================
echo ""
echo "📸 [1/3] Generando thumbnails WebP..."

DURATION=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT")
THUMB_OFFSET=$(echo "if ($DURATION > 300) 300 else $DURATION * 0.2" | bc -l)
THUMB_OFFSET=$(printf "%.0f" "$THUMB_OFFSET")

ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" -frames:v 1 -vf "scale=400:-1" -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-card.webp"
ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" -frames:v 1 -vf "scale=1200:-1" -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-hero.webp"
ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" -frames:v 1 -vf "scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black" -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-og.webp"
echo "   ✅ Thumbnails generados."

# =============================================================================
# PASO 2: H.264 NVENC + HLS
# =============================================================================
echo ""
echo "🎬 [2/3] Transcodificando variantes H.264 con FFmpeg NVENC..."

# 4K H.264 (2160p)
echo "   🔹 4K UHD H.264..."
ffmpeg -y -v warning -i "$INPUT" \
  -vf "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -c:v h264_nvenc -preset p6 -rc vbr -b:v 8M -maxrate 12M -bufsize 24M \
  -profile:v high -level 5.1 -g "$GOP" -keyint_min "$GOP" \
  -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time "$HLS_TIME" -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/4k/segment_%03d.ts" "${OUTPUT_DIR}/4k/playlist.m3u8"

# 1080p H.264
echo "   🔹 1080p H.264..."
ffmpeg -y -v warning -i "$INPUT" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -c:v h264_nvenc -preset p6 -rc vbr -b:v 3.5M -maxrate 4M -bufsize 8M \
  -profile:v high -level 4.1 -g "$GOP" -keyint_min "$GOP" \
  -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time "$HLS_TIME" -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/1080p/segment_%03d.ts" "${OUTPUT_DIR}/1080p/playlist.m3u8"

# 720p H.264
echo "   🔹 720p H.264..."
ffmpeg -y -v warning -i "$INPUT" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -c:v h264_nvenc -preset p6 -rc vbr -b:v 2M -maxrate 2.5M -bufsize 5M \
  -profile:v main -level 4.0 -g "$GOP" -keyint_min "$GOP" \
  -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time "$HLS_TIME" -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/720p/segment_%03d.ts" "${OUTPUT_DIR}/720p/playlist.m3u8"

# 480p H.264
echo "   🔹 480p H.264..."
ffmpeg -y -v warning -i "$INPUT" \
  -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -c:v h264_nvenc -preset p6 -rc vbr -b:v 1M -maxrate 1.2M -bufsize 2.4M \
  -profile:v main -level 3.1 -g "$GOP" -keyint_min "$GOP" \
  -c:a aac -b:a 96k -ac 2 \
  -f hls -hls_time "$HLS_TIME" -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/480p/segment_%03d.ts" "${OUTPUT_DIR}/480p/playlist.m3u8"

echo "   ✅ Transcodificación completada."

# =============================================================================
# PASO 3: GENERAR master.m3u8
# =============================================================================
echo ""
echo "📋 [3/3] Generando master.m3u8..."

cat > "${OUTPUT_DIR}/master.m3u8" << 'MASTER_M3U8'
#EXTM3U
#EXT-X-VERSION:3

# 4K H.264 — ~8 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=8128000,RESOLUTION=3840x2160,CODECS="avc1.640033",AUDIO="audio"
4k/playlist.m3u8

# 1080p H.264 — ~3.5 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=3628000,RESOLUTION=1920x1080,CODECS="avc1.640028",AUDIO="audio"
1080p/playlist.m3u8

# 720p H.264 — ~2 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=2128000,RESOLUTION=1280x720,CODECS="avc1.4d4028",AUDIO="audio"
720p/playlist.m3u8

# 480p H.264 — ~1 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=1096000,RESOLUTION=854x480,CODECS="avc1.4d401f",AUDIO="audio"
480p/playlist.m3u8
MASTER_M3U8

echo "   ✅ ${OUTPUT_DIR}/master.m3u8 generado."
echo ""
echo "============================================================"
echo " 🚀 LISTO. Sube la carpeta a MEGA S4 y pega esta ruta:"
echo "    ${COURSE_SLUG}/${LESSON_SLUG}/master.m3u8"
echo "============================================================"
