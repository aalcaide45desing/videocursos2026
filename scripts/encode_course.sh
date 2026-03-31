#!/usr/bin/env bash
# =============================================================================
# encode_course.sh — Transcodificación AV1 NVENC + HLS + Thumbnail WebP
# =============================================================================
# Plataforma: LMS Videocursos 2026
# Hardware:   NVIDIA RTX 4090 (av1_nvenc Ada Lovelace) + AMD 9950X3D
# Requisitos: FFmpeg compilado con soporte av1_nvenc (FFmpeg 7.x recomendado)
#
# USO:
#   ./encode_course.sh "video_entrada.mp4" "slug-del-curso" "01-titulo-leccion"
#
# EJEMPLO:
#   ./encode_course.sh "grabacion_blender_leccion1.mp4" "blender-desde-cero" "01-introduccion"
#
# SALIDA (en ./output/<slug-curso>/<slug-leccion>/):
#   master.m3u8           → Playlist master ABR (5 variantes)
#   4k/                   → AV1 3840×2160 ~6-8 Mbps CQ28
#   1080p/                → AV1 1920×1080 ~2.5-3.5 Mbps CQ30
#   720p/                 → AV1 1280×720  ~1.2-1.8 Mbps CQ32
#   360p/                 → AV1 640×360   ~400-600 Kbps CQ34
#   720p_h264/            → H.264 fallback 1280×720 ~2.5 Mbps CRF23
#   thumbnails/           → card(400px), hero(1200px), og(1200×630) en WebP
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

# Duración del segmento HLS en segundos
HLS_TIME=4

# GOP para 24fps y 30fps (2 segundos de intervalo de keyframe)
# Se detecta automáticamente según el FPS del video
DETECT_FPS=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=r_frame_rate \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT" | bc -l)
FPS_ROUNDED=$(printf "%.0f" "$DETECT_FPS")
GOP=$(( FPS_ROUNDED * 2 ))   # 2 segundos = keyframe cada 2s

echo "============================================================"
echo " LMS Videocursos 2026 — Transcodificación AV1 + HLS"
echo "============================================================"
echo " Entrada:      $INPUT"
echo " Curso:        $COURSE_SLUG"
echo " Lección:      $LESSON_SLUG"
echo " FPS detectado: ${FPS_ROUNDED} (GOP=${GOP})"
echo " Salida:       $OUTPUT_DIR"
echo "============================================================"

# =============================================================================
# CREAR ESTRUCTURA DE DIRECTORIOS
# =============================================================================
mkdir -p \
  "${OUTPUT_DIR}/4k" \
  "${OUTPUT_DIR}/1080p" \
  "${OUTPUT_DIR}/720p" \
  "${OUTPUT_DIR}/360p" \
  "${OUTPUT_DIR}/720p_h264" \
  "${OUTPUT_DIR}/subtitles" \
  "${OUTPUT_DIR}/resources" \
  "${THUMB_DIR}"

# =============================================================================
# PASO 1: THUMBNAIL WebP (a los 5 minutos)
# =============================================================================
echo ""
echo "📸 [1/3] Generando thumbnails WebP..."

# Verificar si el video tiene al menos 5 minutos; si no, usar el 20% del tiempo
DURATION=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT")
THUMB_OFFSET=$(echo "if ($DURATION > 300) 300 else $DURATION * 0.2" | bc -l)
THUMB_OFFSET=$(printf "%.0f" "$THUMB_OFFSET")

# card: 400px ancho (para tarjetas de catálogo)
ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" \
  -frames:v 1 -vf "scale=400:-1" \
  -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-card.webp"

# hero: 1200px ancho (para cabecera de lección)
ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" \
  -frames:v 1 -vf "scale=1200:-1" \
  -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-hero.webp"

# og: 1200×630px (Open Graph / redes sociales)
ffmpeg -y -ss "${THUMB_OFFSET}" -i "$INPUT" \
  -frames:v 1 -vf "scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black" \
  -quality 80 "${THUMB_DIR}/${LESSON_SLUG}-og.webp"

echo "   ✅ Thumbnails generados en ${THUMB_DIR}/"

# =============================================================================
# PASO 2: TRANSCODIFICACIÓN AV1 NVENC + H.264 FALLBACK + SEGMENTOS HLS
# =============================================================================
echo ""
echo "🎬 [2/3] Transcodificando variantes AV1 + H.264 con FFmpeg NVENC..."
echo "   (RTX 4090 dual NVENC Ada Lovelace — primera variante...)"
echo ""

# -----------------------------------------------------------------------
# VARIANTE 1: AV1 4K (3840×2160) — CQ28 ~6-8 Mbps
# -----------------------------------------------------------------------
echo "   🔹 4K AV1 (CQ28)..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2" \
  -c:v av1_nvenc \
  -preset p7 \
  -cq 28 \
  -bf 0 \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time "$HLS_TIME" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/4k/segment_%03d.ts" \
  "${OUTPUT_DIR}/4k/playlist.m3u8" 2>&1 | grep -E "frame=|fps=|speed=|error|Error" || true

# -----------------------------------------------------------------------
# VARIANTE 2: AV1 1080p (1920×1080) — CQ30 ~2.5-3.5 Mbps  [PRINCIPAL]
# -----------------------------------------------------------------------
echo "   🔹 1080p AV1 (CQ30) — variante principal..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v av1_nvenc \
  -preset p7 \
  -cq 30 \
  -bf 0 \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time "$HLS_TIME" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/1080p/segment_%03d.ts" \
  "${OUTPUT_DIR}/1080p/playlist.m3u8" 2>&1 | grep -E "frame=|fps=|speed=|error|Error" || true

# -----------------------------------------------------------------------
# VARIANTE 3: AV1 720p (1280×720) — CQ32 ~1.2-1.8 Mbps
# -----------------------------------------------------------------------
echo "   🔹 720p AV1 (CQ32)..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v av1_nvenc \
  -preset p7 \
  -cq 32 \
  -bf 0 \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time "$HLS_TIME" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/720p/segment_%03d.ts" \
  "${OUTPUT_DIR}/720p/playlist.m3u8" 2>&1 | grep -E "frame=|fps=|speed=|error|Error" || true

# -----------------------------------------------------------------------
# VARIANTE 4: AV1 360p (640×360) — CQ34 ~400-600 Kbps
# -----------------------------------------------------------------------
echo "   🔹 360p AV1 (CQ34) — fallback conexiones lentas..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2" \
  -c:v av1_nvenc \
  -preset p7 \
  -cq 34 \
  -bf 0 \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  -c:a aac -b:a 96k -ac 2 \
  -f hls \
  -hls_time "$HLS_TIME" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/360p/segment_%03d.ts" \
  "${OUTPUT_DIR}/360p/playlist.m3u8" 2>&1 | grep -E "frame=|fps=|speed=|error|Error" || true

# -----------------------------------------------------------------------
# VARIANTE 5: H.264 720p (fallback Safari pre-M1 / iPhone antiguo)
# -----------------------------------------------------------------------
echo "   🔹 720p H.264 (CRF23) — fallback legacy devices..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v h264_nvenc \
  -preset p7 \
  -crf 23 \
  -b:v 2.5M \
  -maxrate 3M \
  -bufsize 6M \
  -profile:v high \
  -level 4.2 \
  -bf 2 \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time "$HLS_TIME" \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_filename "${OUTPUT_DIR}/720p_h264/segment_%03d.ts" \
  "${OUTPUT_DIR}/720p_h264/playlist.m3u8" 2>&1 | grep -E "frame=|fps=|speed=|error|Error" || true

echo "   ✅ Transcodificación completada."

# =============================================================================
# PASO 3: GENERAR master.m3u8
# =============================================================================
echo ""
echo "📋 [3/3] Generando master.m3u8..."

cat > "${OUTPUT_DIR}/master.m3u8" << 'MASTER_M3U8'
#EXTM3U
#EXT-X-VERSION:3

# AV1 4K — ~7 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=7000000,RESOLUTION=3840x2160,CODECS="av01.0.17M.08",AUDIO="audio"
4k/playlist.m3u8

# AV1 1080p — ~3 Mbps (VARIANTE DEFAULT)
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080,CODECS="av01.0.08M.08",AUDIO="audio"
1080p/playlist.m3u8

# AV1 720p — ~1.5 Mbps
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720,CODECS="av01.0.05M.08",AUDIO="audio"
720p/playlist.m3u8

# AV1 360p — ~500 Kbps
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360,CODECS="av01.0.00M.08",AUDIO="audio"
360p/playlist.m3u8

# H.264 720p fallback — ~2.5 Mbps (Safari pre-M1 / iPhones legacy)
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.640028",AUDIO="audio"
720p_h264/playlist.m3u8
MASTER_M3U8

echo "   ✅ ${OUTPUT_DIR}/master.m3u8 generado."

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo "============================================================"
echo " ✅ LECCIÓN PROCESADA CORRECTAMENTE"
echo "============================================================"
echo " Curso:   $COURSE_SLUG"
echo " Lección: $LESSON_SLUG"
echo " Ruta MEGA S4 a pegar en admin:"
echo "   ${COURSE_SLUG}/${LESSON_SLUG}/master.m3u8"
echo ""
echo " Tamaño aproximado de la salida:"
du -sh "${OUTPUT_DIR}" 2>/dev/null || echo "   (no disponible en este OS)"
echo ""
echo " Próximo paso:"
echo "   Sube la carpeta con rclone o AWS CLI:"
echo "   rclone copy \"${OUTPUT_DIR}/..\" mega-s4:BUCKET_NAME/${COURSE_SLUG}/ --progress"
echo "============================================================"
