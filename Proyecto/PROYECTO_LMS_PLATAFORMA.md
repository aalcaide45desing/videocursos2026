# CONTEXTO GLOBAL DEL PROYECTO

Eres un Senior Full-Stack Developer y Arquitecto Cloud, experto en ecosistemas Serverless (Next.js), bases de datos relacionales (PostgreSQL) y plataformas LMS de video streaming de alta seguridad.

Tu objetivo es desarrollar una plataforma de e-learning modular, altamente escalable y blindada contra piratería masiva. El contenido principal serán cursos de alto rendimiento técnico (ej. Blender, Unreal Engine, Impresión 3D).

## TECH STACK DEFINITIVO

- **Frontend & Backend:** Next.js 15+ (App Router) + TypeScript + Tailwind CSS.
- **Hosting:** Vercel (Edge & Serverless Functions).
- **Autenticación:** Clerk (plan gratuito, 50.000 usuarios retenidos/mes).
- **Base de Datos:** Neon (PostgreSQL Serverless, plan gratuito: 100 CU-hours/mes, 0.5 GB storage) + Drizzle ORM.
- **Almacenamiento & Streaming:** MEGA S4 (Protocolo S3, plan Pro Flexi 3 TB contratado, 5× egress incluido) + AWS SDK v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner).
- **Reproductor de Video:** Vidstack (React, soporte HLS nativo con hls.js integrado, Tailwind plugin, SSR-ready, production-ready layouts).
- **Codec de Video:** AV1 (av1_nvenc vía FFmpeg + RTX 4090 con doble NVENC Ada Lovelace) + H.264 fallback mínimo para dispositivos legacy.
- **Formato de Imágenes:** WebP para thumbnails y assets de la plataforma.
- **Pasarela de Pago:** Hotmart (vía Webhooks).
- **Email Marketing:** MailerLite API (plan gratuito: 500 suscriptores, 12.000 emails/mes).

## ENTORNO DE CODIFICACIÓN LOCAL

- **GPU:** NVIDIA RTX 4090 (2× NVENC 8ª generación, AV1/HEVC/H.264 por hardware, Split-Frame Encoding para 8K60).
- **CPU:** AMD Ryzen 9 9950X3D (16 cores / 32 threads, fallback SVT-AV1 si se necesita máxima calidad por software).
- **Uso:** La transcodificación de todo el contenido (video, thumbnails) se realiza localmente antes de subir a MEGA S4. No se transcodifica en la nube.

## FLUJO DE DESARROLLO Y DESPLIEGUE

El desarrollo se realiza **100% en local** usando `next dev` (localhost:3000). El código se versiona en **GitHub**. El despliegue a producción se realiza conectando el repositorio de GitHub a **Vercel**, que detecta automáticamente que es un proyecto Next.js y lo despliega como aplicación serverless.

### Flujo:
1. **Desarrollo local** → `npm run dev` en localhost:3000.
2. **Push a GitHub** → rama `main` para producción, ramas `feature/*` para desarrollo.
3. **Vercel** → detecta el push, hace build y despliega automáticamente. Las API Routes se convierten en Serverless Functions. Los componentes de página se sirven desde Edge/CDN.
4. **Variables de entorno** → Se configuran en el dashboard de Vercel (Settings → Environment Variables). En local se usa `.env.local`.

### Variables de entorno requeridas (.env.local):
```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MEGA S4 (NUNCA usar NEXT_PUBLIC_ para estas)
MEGA_S4_ACCESS_KEY=...
MEGA_S4_SECRET_KEY=...
MEGA_S4_BUCKET=nombre-del-bucket
MEGA_S4_REGION=eu-central-1
MEGA_S4_ENDPOINT=https://s3.eu-central-1.s4.mega.io

# Hotmart Webhook
HOTMART_WEBHOOK_SECRET=...

# MailerLite
MAILERLITE_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **IMPORTANTE:** En Vercel, `NEXT_PUBLIC_APP_URL` debe ser el dominio de producción (ej: `https://tudominio.com`). Las variables sin prefijo `NEXT_PUBLIC_` solo están disponibles en el servidor (API Routes, Server Components), nunca en el cliente.

### Configuración CORS en MEGA S4

Cuando el navegador del alumno consuma los segmentos de video directamente desde MEGA S4 (via presigned URLs), MEGA S4 necesita responder con headers CORS permitiendo el dominio de la aplicación. MEGA S4 es S3-compatible y soporta `PutBucketCors` via AWS SDK o AWS CLI.

Configurar usando AWS CLI apuntando a MEGA S4:
```bash
# Archivo cors-config.json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://tudominio.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Content-Length", "Content-Range", "Content-Type"],
      "MaxAgeSeconds": 86400
    }
  ]
}

# Aplicar al bucket
aws s3api put-bucket-cors \
  --bucket nombre-del-bucket \
  --cors-configuration file://cors-config.json \
  --endpoint-url https://s3.eu-central-1.s4.mega.io
```

> **NOTA:** Incluir `http://localhost:3000` en `AllowedOrigins` durante desarrollo. En producción, reemplazar o añadir el dominio real de Vercel. Solo se necesitan `GET` y `HEAD` porque los alumnos solo leen/reproducen contenido, nunca suben.

## REGLAS ESTRICTAS DE DESARROLLO

1. Escribe código modular, tipado estrictamente con TypeScript y documentado.
2. Maneja los errores con try/catch y utiliza variables de entorno (.env.local) para todas las claves. Las variables sensibles (MEGA S4, Clerk secret, Hotmart, MailerLite) NUNCA llevan prefijo `NEXT_PUBLIC_`.
3. El frontend debe ser totalmente responsive, con una UI moderna similar a plataformas premium.
4. NUNCA expongas las credenciales de MEGA S4 en el cliente. Las presigned URLs se generan en Server Components o API Routes (Serverless Functions en Vercel).
5. Usa Drizzle ORM (no Prisma). El schema se define directamente en TypeScript con inferencia de tipos nativa, sin paso de generación de código. Drizzle tiene bundles más pequeños (~7 KB) y funciona nativamente en serverless sin binarios.
6. Todas las API Routes (`/api/*`) se ejecutan como Serverless Functions en Vercel. Diseña cada endpoint para ser stateless: sin estado en memoria entre invocaciones, toda la persistencia va a Neon.
7. Usa el driver serverless de Neon (`@neondatabase/serverless`) que funciona sobre WebSockets/HTTP, compatible con edge y serverless sin conexiones TCP persistentes.
8. Trabaja paso a paso. No intentes construir todo de una vez. Ejecuta por fases. Al terminar una fase, detente y espera mi confirmación ("Continúa a la Fase X").

---

# FASE 0: Pipeline de Contenido Multimedia (Pre-desarrollo)

> Esta fase se ejecuta localmente en el PC del desarrollador (RTX 4090 + 9950X3D) y define cómo se prepara el contenido antes de que exista una sola línea de código de la plataforma.

## 0.1 — Transcodificación de Video a AV1 con FFmpeg + NVENC

Todos los videos se codifican usando el encoder por hardware `av1_nvenc` de la RTX 4090, que ofrece velocidades de 75-100% superiores a `hevc_nvenc` con igual o mejor calidad a bitrates bajos, gracias a los dos NVENC de 8ª generación (Ada Lovelace).

### Bitrate Ladder ABR (Adaptive Bitrate)

Los cursos son screencasts técnicos (Blender, Unreal, Impresión 3D): contenido con UI detallada, texto pequeño, y escenas 3D con movimiento moderado. Este tipo de contenido comprime excepcionalmente bien con AV1 por sus grandes áreas estáticas.

**Variantes AV1 (codec principal):**

| Resolución | Bitrate objetivo | CQ | Uso |
|---|---|---|---|
| 4K (3840×2160) | ~6-8 Mbps | 28 | Alumnos con monitor 4K, máximo detalle de UI |
| 1080p (1920×1080) | ~2.5-3.5 Mbps | 30 | Resolución principal, mayoría de alumnos |
| 720p (1280×720) | ~1.2-1.8 Mbps | 32 | Conexiones móviles o lentas |
| 360p (640×360) | ~400-600 Kbps | 34 | Fallback extremo |

**Variante H.264 (fallback para dispositivos legacy):**

| Resolución | Bitrate objetivo | CRF | Uso |
|---|---|---|---|
| 720p (1280×720) | ~2.5 Mbps | 23 | Safari pre-M1, iPhones antiguos pre-15 |

AV1 tiene soporte nativo en Chrome, Firefox, Edge y Safari desde iPhone 15 / M1 en adelante. El fallback H.264 720p cubre el ~5% restante de usuarios con hardware antiguo.

### Configuración de segmentos HLS

- **Formato:** HLS (.m3u8 + segmentos .ts o CMAF fMP4).
- **Duración de segmentos:** ~4-6 segundos (`-hls_time 4`).
- **Keyframe interval (GOP):** 2 segundos (`-g 48` para 24fps, `-g 60` para 30fps) para cambio suave entre calidades.
- **Tipo de playlist:** VOD (`-hls_playlist_type vod`).
- **Flags:** `-hls_flags independent_segments`.
- **Audio:** AAC-LC, 128 kbps para resoluciones ≥720p, 96 kbps para 360p.

### Script FFmpeg de referencia

Crea un script bash (`encode_course.sh`) que, dado un archivo de video de entrada:

1. Genere las 4 variantes AV1 + 1 variante H.264 fallback en una sola pasada con `-filter_complex` y `split`.
2. Produzca segmentos HLS individuales por resolución en carpetas separadas (`4k/`, `1080p/`, `720p/`, `360p/`, `720p_h264/`).
3. Genere un `master.m3u8` con las 5 variantes listadas, indicando `CODECS="av01.0...."` para AV1 y `CODECS="avc1...."` para H.264.
4. Extraiga un thumbnail WebP automático a los 5 minutos del video (`-ss 00:05:00 -frames:v 1 -vf "scale=1280:-1" -quality 80`).

### Estimaciones de almacenamiento

| Concepto | Estimación |
|---|---|
| 1 curso (10h) con ladder AV1 completo + H.264 fallback | ~20-25 GB |
| 20 cursos | ~400-500 GB |
| Thumbnails WebP (20 cursos × ~50 imágenes) | ~50 MB |
| Recursos descargables (.blend, .pdf, etc.) | ~50-100 GB |
| **Total estimado** | **~500-600 GB de 3 TB disponibles** |

### Estimaciones de egress MEGA S4

Con AV1 a ~3 Mbps (1080p), un alumno viendo 1 hora consume ~1.35 GB. Con 5× egress sobre ~550 GB almacenados = ~2.75 TB de transferencia mensual disponible. Eso permite ~2.000 horas de visualización/mes antes de acercarse al límite de fair use.

## 0.2 — Generación de Imágenes WebP

- **Thumbnails de lecciones:** Extraídos con FFmpeg durante la transcodificación, 3 tamaños: card (400px ancho), hero (1200px), OG/redes sociales (1200×630px). Formato WebP, quality 80.
- **Assets de la plataforma (logos, iconos, banners):** Convertidos a WebP con `cwebp` o procesados con `sharp` (Node.js) durante el build.
- **Fallback:** No necesario. WebP tiene soporte del ~97% en navegadores en 2026.

## 0.3 — Estructura de Carpetas en MEGA S4

```
bucket-cursos/
├── blender-desde-cero/
│   ├── master.m3u8
│   ├── 4k/
│   │   ├── playlist.m3u8
│   │   └── segment_000.ts, segment_001.ts, ...
│   ├── 1080p/
│   │   ├── playlist.m3u8
│   │   └── segment_000.ts, segment_001.ts, ...
│   ├── 720p/
│   │   ├── playlist.m3u8
│   │   └── segment_000.ts, segment_001.ts, ...
│   ├── 360p/
│   │   ├── playlist.m3u8
│   │   └── segment_000.ts, segment_001.ts, ...
│   ├── 720p_h264/
│   │   ├── playlist.m3u8
│   │   └── segment_000.ts, segment_001.ts, ...
│   ├── thumbnails/
│   │   ├── leccion-01-card.webp
│   │   ├── leccion-01-hero.webp
│   │   └── leccion-01-og.webp
│   ├── subtitles/
│   │   ├── es.vtt
│   │   └── en.vtt
│   └── resources/
│       ├── escena-01.blend
│       └── guia-leccion-01.pdf
└── unreal-engine-5/
    └── (misma estructura)
```

## 0.4 — Subida a MEGA S4

Usar `rclone` o AWS CLI configurado con las credenciales S3 de MEGA S4 (endpoint: `s3.<region>.s4.mega.io`, Signature V4). Subir la carpeta completa de cada curso tras la transcodificación.

- DETENTE y espera confirmación.

---

# FASE 1: Inicialización, Arquitectura y Auth

- Inicializa el proyecto en local:
  ```bash
  npx create-next-app@latest nombre-proyecto --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  cd nombre-proyecto
  git init
  git remote add origin https://github.com/tu-usuario/nombre-proyecto.git
  ```
- Configura la estructura de carpetas estándar:
  ```
  src/
  ├── app/
  │   ├── (public)/          # Rutas públicas (landing, catálogo)
  │   ├── (auth)/             # Login, signup (Clerk)
  │   ├── (platform)/         # Rutas privadas protegidas
  │   │   ├── dashboard/
  │   │   ├── cursos/[slug]/
  │   │   └── admin/          # Panel de administración
  │   └── api/
  │       ├── video/
  │       ├── webhooks/
  │       └── mailerlite/
  ├── components/
  │   ├── ui/                 # Componentes reutilizables (shadcn/ui o custom)
  │   ├── video/              # LessonPlayer, NotesSidebar, etc.
  │   └── layout/             # Navbar, Footer, Sidebar
  ├── db/
  │   ├── schema.ts           # Schema Drizzle
  │   ├── index.ts            # Conexión Neon + Drizzle client
  │   └── migrations/
  ├── lib/
  │   ├── s3.ts               # Cliente MEGA S4 (AWS SDK v3)
  │   ├── presigned.ts        # Generación de presigned URLs
  │   ├── auth.ts             # Helpers de Clerk
  │   └── utils.ts
  └── types/
      └── index.ts
  ```
- Instala Clerk para autenticación:
  ```bash
  npm install @clerk/nextjs
  ```
- Configura el `<ClerkProvider>` en `src/app/layout.tsx` envolviendo toda la aplicación.
- Crea `src/middleware.ts` con `clerkMiddleware()` para proteger las rutas privadas (`/dashboard`, `/cursos/[slug]`, `/admin`). Las rutas públicas (`/`, `/cursos`, `/sign-in`, `/sign-up`, `/api/webhooks/*`) deben ser accesibles sin autenticación.
- Crea las páginas de login y signup usando los componentes `<SignIn />` y `<SignUp />` de Clerk.
- Crea el archivo `.env.local` con todas las variables de entorno (ver sección "Variables de entorno requeridas").
- Añade `.env.local` al `.gitignore` (Next.js lo incluye por defecto).
- Verifica que `npm run dev` arranca correctamente en `localhost:3000` y que el flujo login/signup de Clerk funciona en local.
- Haz el primer commit y push a GitHub.
- DETENTE y espera confirmación.

---

# FASE 2: Base de Datos (Neon) y ORM (Drizzle)

- Instala Drizzle ORM y el driver serverless de Neon:
  ```bash
  npm install drizzle-orm @neondatabase/serverless
  npm install -D drizzle-kit
  ```
- Crea `src/db/index.ts` con la conexión a Neon usando el driver serverless:
  ```typescript
  import { neon } from '@neondatabase/serverless';
  import { drizzle } from 'drizzle-orm/neon-http';
  import * as schema from './schema';

  const sql = neon(process.env.DATABASE_URL!);
  export const db = drizzle(sql, { schema });
  ```
  > **NOTA:** Se usa `neon-http` (HTTP-based, stateless) en lugar de `neon-serverless` (WebSocket) porque es más compatible con Vercel Serverless Functions donde cada invocación es efímera. No se necesitan connection pools: cada request HTTP a Neon es independiente.
- Crea `drizzle.config.ts` en la raíz del proyecto:
  ```typescript
  import { defineConfig } from 'drizzle-kit';

  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  });
  ```
- Diseña el schema en `src/db/schema.ts` con las siguientes entidades:

### Entidades del Schema

**User** (sincronizado con Clerk):
- `id` (text, PK, coincide con el `userId` de Clerk).
- `email` (text, unique).
- `first_name`, `last_name` (text, nullable).
- `avatar_url` (text, nullable).
- `is_suspended` (boolean, default false) → Flag para sistema anti-piratería.
- `created_at`, `updated_at` (timestamps).

**Course:**
- `id` (uuid, PK, auto-generado).
- `title`, `slug` (text, unique para slug).
- `description` (text).
- `thumbnail_url` (text) → Ruta WebP en MEGA S4.
- `price` (decimal).
- `is_published` (boolean, default false).
- `created_at`, `updated_at`.

**Lesson:**
- `id` (uuid, PK).
- `course_id` (FK → Course).
- `title` (text).
- `order` (integer) → Orden de la lección dentro del curso.
- `mega_s4_master_path` (text) → Ruta relativa al `master.m3u8` en MEGA S4 (ej: `blender-desde-cero/master.m3u8`).
- `resources_path` (text, nullable) → Ruta a la carpeta de recursos descargables.
- `duration_seconds` (integer, nullable) → Duración de la lección en segundos.
- `created_at`, `updated_at`.

**LessonProgress:**
- `id` (uuid, PK).
- `user_id` (FK → User).
- `lesson_id` (FK → Lesson).
- `last_position_seconds` (integer, default 0) → Segundo exacto donde el alumno dejó de ver.
- `completed` (boolean, default false).
- `updated_at` (timestamp).
- **Unique constraint:** (`user_id`, `lesson_id`).

**Comment** (foro público de la lección):
- `id` (uuid, PK).
- `lesson_id` (FK → Lesson).
- `user_id` (FK → User).
- `content` (text).
- `created_at`.

**PrivateNote** (notas privadas del alumno):
- `id` (uuid, PK).
- `lesson_id` (FK → Lesson).
- `user_id` (FK → User).
- `content` (text).
- `timestamp_seconds` (integer) → Segundo del video donde se creó la nota.
- `created_at`.

**UserCourseAccess** (tabla pivot para validar compras):
- `id` (uuid, PK).
- `user_id` (FK → User).
- `course_id` (FK → Course).
- `granted_at` (timestamp).
- `source` (text) → Origen del acceso: 'hotmart', 'manual', 'gift'.
- **Unique constraint:** (`user_id`, `course_id`).

- Genera y ejecuta la migración:
  ```bash
  npx drizzle-kit generate   # Genera SQL en src/db/migrations/
  npx drizzle-kit migrate     # Aplica contra Neon (usa DATABASE_URL de .env.local)
  ```
- Verifica en la consola de Neon (neon.tech) que las tablas se crearon correctamente.
- Opcionalmente, usa `npx drizzle-kit studio` para explorar la DB visualmente en local.
- DETENTE y espera confirmación.

---

# FASE 3: Motor de Streaming Seguro (Presigned URLs) y Reproductor

> **IMPORTANTE:** NO se usa un proxy de video en Vercel. Cada fragmento .ts NO debe pasar por una función serverless. En su lugar, se generan presigned URLs con expiración corta para que el navegador del alumno consuma directamente desde MEGA S4. Esto evita consumir el bandwidth de Vercel con tráfico de video.

## 3.1 — Cliente MEGA S4 con AWS SDK v3

- Instala las dependencias:
  ```bash
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  ```
- Crea `src/lib/s3.ts` con un cliente S3 configurado para MEGA S4:
  ```typescript
  import { S3Client } from '@aws-sdk/client-s3';

  export const s3Client = new S3Client({
    endpoint: process.env.MEGA_S4_ENDPOINT!,       // https://s3.eu-central-1.s4.mega.io
    region: process.env.MEGA_S4_REGION!,             // eu-central-1
    credentials: {
      accessKeyId: process.env.MEGA_S4_ACCESS_KEY!,
      secretAccessKey: process.env.MEGA_S4_SECRET_KEY!,
    },
    forcePathStyle: true, // Requerido por MEGA S4 para resolución de bucket
  });
  ```
  > **NOTA:** Este archivo solo se importa en Server Components y API Routes. Nunca en componentes `'use client'`. El `S3Client` se instancia en cada invocación serverless (es stateless). AWS SDK v3 es modular: solo se importa lo necesario, manteniendo el bundle de la Serverless Function pequeño.

- **Configurar CORS en el bucket de MEGA S4** (ver sección "Configuración CORS en MEGA S4" más arriba). Esto es necesario para que hls.js en el navegador pueda hacer fetch de los segmentos .ts directamente desde MEGA S4 sin errores CORS. En desarrollo local, incluir `http://localhost:3000`. Al desplegar en Vercel, añadir el dominio de producción.

## 3.2 — API de Presigned URLs

- Crea API Route (`/api/video/presign`) que:
  1. Verifique la sesión del usuario en Clerk (debe estar autenticado).
  2. Verifique que el usuario NO esté suspendido (`is_suspended = false`).
  3. Verifique que el usuario tenga acceso al curso (consulta `UserCourseAccess`).
  4. Reciba el `lesson_id` como parámetro.
  5. Consulte en Neon el `mega_s4_master_path` de esa lección.
  6. Genere una presigned URL del `master.m3u8` con expiración de 5 minutos usando `getSignedUrl` de `@aws-sdk/s3-request-presigner`.
  7. Devuelva la URL firmada al cliente.

- **Nota sobre HLS y presigned URLs:** El `master.m3u8` referencia URLs relativas a los playlists de cada resolución. Para que funcione con presigned URLs, hay dos opciones:
  - **Opción A (recomendada para simplicidad):** Hacer el bucket de MEGA S4 semi-público (solo lectura) y proteger el acceso a nivel de aplicación (verificación Clerk + UserCourseAccess antes de revelar la ruta). Las URLs de MEGA S4 no son adivinables si se usan nombres aleatorios para las carpetas.
  - **Opción B (máxima seguridad):** Crear un endpoint proxy ligero (`/api/video/manifest`) que intercepte SOLO el `master.m3u8`, reescriba las URLs internas a presigned URLs para cada variante de resolución, y devuelva el manifiesto modificado. Los segmentos .ts se sirven directamente desde MEGA S4 con presigned URLs embebidas en el manifiesto reescrito. Este proxy solo maneja el manifiesto (pocos KB), no los segmentos de video.

## 3.3 — Reproductor Vidstack

- Instala Vidstack para React (`@vidstack/react`).
- Crea el componente `LessonPlayer.tsx` que:
  1. Al montar, haga fetch a `/api/video/presign` con el `lesson_id` para obtener la URL firmada del `master.m3u8`.
  2. Configure Vidstack con la URL obtenida como fuente HLS.
  3. Vidstack usará hls.js internamente (carga automática desde CDN) para reproducir el stream AV1 adaptativo, con fallback a H.264 para navegadores sin soporte AV1.
  4. Permita al usuario cambiar la calidad visual manualmente (selector de calidad nativo de Vidstack que lee las variantes del master.m3u8).
  5. Incluya un selector para activar/desactivar subtítulos (.vtt), configurados como text tracks de Vidstack.
  6. Implemente el layout por defecto de Vidstack (`DefaultVideoLayout`) con soporte light/dark mode y personalización via Tailwind.

## 3.4 — Guardado de Progreso

- El componente `LessonPlayer.tsx` debe escuchar el evento `time-update` de Vidstack.
- Cada 15-30 segundos, envía un `PATCH` a `/api/progress` con `{ lesson_id, last_position_seconds }`.
- Al cargar una lección, consulta `LessonProgress` y usa `player.currentTime = last_position_seconds` para retomar donde el alumno lo dejó.
- Cuando el alumno llega al 90%+ de la duración, marca `completed = true`.

- DETENTE y espera confirmación.

---

# FASE 4: Interacción del Alumno (Timestamps y Comunidad)

## 4.1 — Comentarios Públicos (Foro de Dudas)

- Crea el componente de Comentarios Públicos debajo del video (tipo foro de dudas).
- Cada comentario muestra: avatar del usuario (Clerk), nombre, fecha relativa, contenido.
- Ordenados cronológicamente (más recientes primero o últimos primero, configurable).
- API Routes: `GET /api/comments?lesson_id=...` y `POST /api/comments`.
- Solo usuarios con acceso al curso pueden comentar (verificar `UserCourseAccess`).

## 4.2 — Notas Privadas Interactivas

- Crea el sistema interactivo de Notas Privadas:
  1. Añade un botón en la UI del reproductor: "Añadir nota en este minuto".
  2. Al hacer clic, captura el `currentTime` exacto de Vidstack, pausa el video y abre un input/textarea.
  3. Al guardar, envía `POST /api/notes` con `{ lesson_id, content, timestamp_seconds }`.
  4. Guarda el texto y el `timestamp_seconds` en Neon (tabla `PrivateNote`).
  5. Renderiza una lista lateral (sidebar o panel colapsable) con las notas del usuario para esa lección, ordenadas por timestamp.
  6. Al hacer clic en un item de la lista, ejecuta `player.currentTime = nota.timestamp_seconds` en Vidstack para saltar a ese segundo del video automáticamente.
  7. Las notas son privadas: cada usuario solo ve las suyas.

- DETENTE y espera confirmación.

---

# FASE 5: Seguridad Anti-Piratería (Detección de Anomalías + Watermark)

## 5.1 — Rate Limiter en la API de Presigned URLs

- Implementa un Rate Limiter en la API Route `/api/video/presign` (o en el endpoint proxy de manifiestos si se usa Opción B).
- Lógica estricta: Si un mismo `user_id` solicita una cantidad anormal de presigned URLs o cambia de lección masivamente (ej. solicita más de 50 manifiestos en menos de 5 minutos, propio de un bot o software de descarga), actúa:
  1. Marca su cuenta en Neon (`is_suspended = true`).
  2. Bloquea las peticiones en la API devolviendo un HTTP 403.
  3. Muestra un aviso en el frontend indicando suspensión por actividad inusual.

## 5.2 — Watermark Dinámico Anti-Screen-Recording

- Implementa un overlay semi-transparente en el componente `LessonPlayer.tsx` usando CSS/Canvas.
- El watermark muestra el email del usuario (obtenido de Clerk) posicionado de forma aleatoria sobre el video.
- Opacidad baja (~5-10%) para no molestar visualmente pero suficiente para ser rastreable si alguien graba la pantalla.
- El watermark se renderiza en el cliente (overlay CSS), NO se quema en el video. Esto es suficiente como disuasión y permite rastreo.

- DETENTE y espera confirmación.

---

# FASE 6: Webhooks (Hotmart) y Email Marketing (MailerLite)

## 6.1 — Webhook de Hotmart

- Crea API Route POST (`/api/webhooks/hotmart`) para eventos de compra aprobada.
- Valida la firma del payload usando HMAC-SHA256 con el header `x-hotmart-signature` y la variable de entorno `HOTMART_WEBHOOK_SECRET`.
- Al recibir el evento `PURCHASE_COMPLETE`:
  1. Extrae el email del comprador del payload.
  2. Busca o crea el usuario en Neon (tabla `User`, sincronizando con el `userId` de Clerk si ya existe).
  3. Crea el registro en `UserCourseAccess` con `source = 'hotmart'`.
  4. Llama a MailerLite API para mover al usuario del grupo "Interesados_Curso_[slug]" al grupo "Alumnos_Curso_[slug]", deteniendo los emails de venta.
- Implementa idempotencia: si el `UserCourseAccess` ya existe para ese user+course, no duplicar.
- Maneja reintentos: Hotmart reintenta hasta 5 veces en caso de error.

## 6.2 — Integración MailerLite

- Crea el botón "Me interesa" / "Añadir a Favoritos" en la landing page pública de los cursos.
- Al pulsar, haz un `POST /api/mailerlite/subscribe` que:
  1. Reciba el email del usuario (de Clerk si está logueado, o de un input si es visitante).
  2. Haga un POST a la API de MailerLite para suscribir el email al grupo "Interesados_Curso_[slug]".
  3. Esto disparará las automatizaciones de ventas/copywriting configuradas en MailerLite.
- **Nota sobre límites:** El plan gratuito de MailerLite permite 500 suscriptores y 12.000 emails/mes. Incluye el logo de MailerLite en todos los emails. Suficiente para el lanzamiento.

- DETENTE y espera confirmación.

---

# FASE 7: Panel de Administración (CMS Local)

- Crea un dashboard oculto (`/admin`) protegido por validación de rol. Solo el usuario con rol `admin` (configurado en los metadatos de Clerk: `publicMetadata.role === 'admin'`) puede acceder.
- Desarrolla formularios visuales conectados a Drizzle para:

### Gestión de Cursos
- Crear, editar y eliminar cursos.
- Campos: título, slug (auto-generado), descripción (con editor rich text básico o textarea markdown), precio, thumbnail URL (ruta WebP en MEGA S4), estado (borrador/publicado).

### Gestión de Lecciones
- Crear, editar, reordenar (drag & drop) y eliminar lecciones dentro de un curso.
- El formulario de lecciones debe permitir pegar directamente la ruta relativa del `master.m3u8` en MEGA S4 (ej: `blender-desde-cero/master.m3u8`) para que quede guardado en el campo `mega_s4_master_path` y listo para ser reproducido.
- Campo para duración en segundos (o auto-detectado).
- Campo para ruta de recursos descargables.

### Gestión de Accesos
- Buscar usuarios por email.
- Otorgar o revocar acceso manual a cursos (source = 'manual').
- Ver y desbloquear usuarios suspendidos.

### Dashboard de Métricas (básico)
- Total de usuarios registrados.
- Total de accesos activos por curso.
- Lecciones completadas (porcentaje medio de avance por curso).

- DETENTE y confirma que la arquitectura base está 100% operativa.

---

# FASE 8: Landing Pages Públicas y SEO

> Fase adicional necesaria para que Hotmart + MailerLite funcionen correctamente y para posicionamiento orgánico.

- Crea páginas públicas de catálogo de cursos (`/cursos`) y detalle de cada curso (`/cursos/[slug]`).
- Las páginas de detalle deben incluir:
  - Hero con thumbnail WebP del curso.
  - Descripción completa, temario (lista de lecciones con duración, sin acceso al video).
  - Precio y botón de compra (enlace a Hotmart checkout).
  - Botón "Me interesa" (integración MailerLite, Fase 6.2).
  - Testimonios / valoraciones (futuro).
- **SEO:** Implementa meta tags dinámicos con `generateMetadata()` de Next.js:
  - `title`, `description`, `og:image` (thumbnail OG WebP del curso).
  - Schema markup JSON-LD para cursos (`@type: Course`).
  - Sitemap dinámico (`/sitemap.xml`).
- Las páginas públicas se renderizan con SSR/ISR para SEO óptimo.

- DETENTE y espera confirmación.

---

# RESUMEN DE COSTES MENSUALES ESTIMADOS

| Servicio | Plan | Coste |
|---|---|---|
| MEGA S4 (Pro Flexi 3TB, ya contratado) | Pro Flexi | ~€15/mes |
| Vercel | Hobby (proyectos personales) o Pro ($20) si se necesita uso comercial | $0 - $20/mes |
| Neon PostgreSQL | Free (100 CU-hours, 0.5 GB) | $0 |
| Clerk Auth | Free (50.000 usuarios retenidos/mes) | $0 |
| MailerLite | Free (500 subs, 12.000 emails/mes) | $0 |
| Vidstack | Open Source | $0 |
| FFmpeg + NVENC | Open Source + hardware propio | $0 |
| Hotmart | Comisión por venta (sin coste fijo) | $0 |
| Drizzle ORM | Open Source | $0 |
| **Total estimado** | | **€15-35/mes** |

---

# NOTAS TÉCNICAS ADICIONALES

## Sobre Drizzle vs Prisma
Se usa Drizzle ORM porque: el schema se define directamente en TypeScript sin paso de generación, tiene bundles más pequeños (~7 KB vs ~200+ KB de Prisma), funciona nativamente en edge runtimes sin workarounds, y tiene inferencia de tipos instantánea sin ejecutar `generate`. El desarrollador ya domina este ORM.

## Sobre AV1 vs H.265 (HEVC)
Se eligió AV1 como codec principal porque: la RTX 4090 codifica AV1 por hardware (av1_nvenc) más rápido que HEVC con igual o mejor calidad a bitrates bajos; AV1 es royalty-free sin problemas de licencias; AV1 tiene mejor soporte en navegadores web que HEVC (Chrome, Firefox y Edge soportan AV1 nativamente, mientras que HEVC en Chrome/Firefox tiene soporte parcial e inconsistente). Se incluye un único stream H.264 720p como fallback universal.

## Sobre Presigned URLs vs Proxy de Video
NO se usa un proxy serverless que intercepte cada fragmento .ts del HLS. Un video de 1 hora en 1080p tiene ~600+ segmentos. Con alumnos simultáneos, cada segmento pasando por Vercel consumiría todo el bandwidth del plan rápidamente. En su lugar, se generan presigned URLs desde una API Route ligera (una sola llamada), y el navegador consume directamente desde MEGA S4. Vercel solo sirve HTML/CSS/JS y APIs ligeras.

## Sobre la escalabilidad futura
- Si el egress de MEGA S4 se queda corto, la siguiente evolución es poner un CDN delante (Cloudflare Free o BunnyCDN ~$1/mes) como cache de los segmentos de video.
- Si Neon Free se queda corto, el plan Launch es $19/mes con 300 compute hours y 10 GB storage.
- Si MailerLite se queda corto (>500 subs), el plan Growing Business empieza en $10/mes. Alternativa: EmailOctopus (2.500 subs gratis).
- Si Clerk se queda corto (>50.000 usuarios), el plan Pro empieza en $20/mes.
