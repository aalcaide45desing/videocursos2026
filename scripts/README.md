# Scripts — Pipeline de Contenido Multimedia

## `encode_course.sh` — Transcodificación AV1 + HLS

### Requisitos
- FFmpeg 7.x compilado con `av1_nvenc` (soporte NVIDIA RTX 4090)
- NVIDIA CUDA drivers actualizados
- `bc` y `ffprobe` instalados (incluidos con FFmpeg)
- Git Bash o WSL (en Windows)

### Uso básico
```bash
./encode_course.sh "video_original.mp4" "slug-del-curso" "01-titulo-leccion"
```

### Ejemplo real
```bash
./encode_course.sh "grabaciones/blender_clase1.mp4" "blender-desde-cero" "01-introduccion-interfaz"
```

### Salida generada
```
output/blender-desde-cero/01-introduccion-interfaz/
├── master.m3u8          ← Ruta a pegar en el admin de la plataforma
├── 4k/                  ← AV1 3840×2160 CQ28 ~6-8 Mbps
│   ├── playlist.m3u8
│   └── segment_001.ts, ...
├── 1080p/               ← AV1 1920×1080 CQ30 ~2.5-3.5 Mbps (DEFAULT)
├── 720p/                ← AV1 1280×720  CQ32 ~1.2-1.8 Mbps
├── 360p/                ← AV1 640×360   CQ34 ~400-600 Kbps
├── 720p_h264/           ← H.264 1280×720 CRF23 ~2.5 Mbps (FALLBACK)
└── thumbnails/
    ├── 01-introduccion-interfaz-card.webp   (400px)
    ├── 01-introduccion-interfaz-hero.webp   (1200px)
    └── 01-introduccion-interfaz-og.webp     (1200×630px)
```

### Subida a MEGA S4 después de encodear
```bash
# Con rclone (configurar primero: rclone config)
rclone copy "output/blender-desde-cero/" mega-s4:nombre-bucket/blender-desde-cero/ --progress

# Con AWS CLI apuntando a MEGA S4
aws s3 sync "output/blender-desde-cero/" \
  s3://nombre-bucket/blender-desde-cero/ \
  --endpoint-url https://s3.eu-central-1.s4.mega.io
```

### Ruta a introducir en el panel admin
Una vez subido, la ruta del `master.m3u8` a introducir en el campo `mega_s4_master_path` del admin es:
```
blender-desde-cero/01-introduccion-interfaz/master.m3u8
```

---

## `cors-config.json` — Configuración CORS para MEGA S4

Aplicar una sola vez con AWS CLI:
```bash
aws s3api put-bucket-cors \
  --bucket nombre-bucket \
  --cors-configuration file://cors-config.json \
  --endpoint-url https://s3.eu-central-1.s4.mega.io
```

> ⚠️ **IMPORTANTE**: Cuando elijas el dominio de producción, añadirlo a `AllowedOrigins` y volver a aplicar.
