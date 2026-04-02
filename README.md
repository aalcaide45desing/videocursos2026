# 🎓 Videocursos 2026 — Plataforma LMS Premium

Academia de cursos online altamente segura con streaming AV1 protegido, panel de administración completo y automatización de ventas vía Hotmart.

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Base de Datos | Neon PostgreSQL (Serverless) + Drizzle ORM |
| Autenticación | Clerk (Email, Google, GitHub) |
| Almacenamiento Vídeo | MEGA S4 (S3-compatible) |
| Reproductor | Vidstack (HLS adaptativo) |
| Email Marketing | MailerLite |
| Ventas | Hotmart (Webhooks automáticos) |
| Despliegue | Vercel (Región EU - Frankfurt) |

---

## ⚡ Inicio Rápido (Local)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno (ya creado, solo rellenar los TODO)
# Editar .env.local

# 3. Migrar base de datos
npx drizzle-kit generate
npx drizzle-kit migrate

# 4. Arrancar servidor de desarrollo  
npm run dev
# → http://localhost:3000
```

---

## 🔑 Variables de Entorno (`.env.local`)

| Variable | Cómo obtenerla |
|----------|---------------|
| `DATABASE_URL` | Neon Console → Connection Details |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Add Endpoint → Signing Secret |
| `MEGA_S4_ACCESS_KEY` | MEGA → Ajustes → S4 Storage → Credenciales |
| `MEGA_S4_SECRET_KEY` | Ídem |
| `MEGA_S4_BUCKET` | Nombre del bucket creado en MEGA S4 |
| `HOTMART_WEBHOOK_SECRET` | Hotmart → Webhooks → Hottok |
| `MAILERLITE_API_KEY` | MailerLite → Integrations → API |

---

## 🗂️ Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/          # Páginas de Sign In / Sign Up (Clerk)
│   ├── (public)/        # Catálogo y páginas de venta de cursos
│   │   ├── cursos/      # Lista de cursos
│   │   └── cursos/[id]/ # Página de venta individual (SEO + JSON-LD)
│   ├── (platform)/      # Zona privada (requiere auth)
│   │   ├── dashboard/   # Panel del alumno (mis cursos comprados)
│   │   ├── play/[lessonId]/ # Reproductor de vídeo + Notas + Foro
│   │   └── admin/       # Panel de administración (solo admins)
│   │       ├── cursos/  # Gestión de cursos (CRUD)
│   │       ├── lecciones/ # Gestión de lecciones (CRUD)
│   │       └── accesos/ # Monitor de ventas y seguridad
│   └── api/
│       ├── admin/       # Endpoints protegidos solo para admins
│       ├── comments/    # Foro de dudas por lección
│       ├── notes/       # Notas privadas con timestamp
│       ├── progress/    # Guardado de progreso de vídeo
│       ├── video/manifest/ # Proxy seguro de manifiestos HLS
│       └── webhooks/
│           ├── clerk/   # Sincronización de usuarios con Neon
│           └── hotmart/ # Asignación automática de accesos al comprar
├── components/
│   ├── admin/           # UI exclusiva del panel de administración
│   ├── layout/          # Navbar pública
│   ├── marketing/       # Botón de captación de leads (MailerLite)
│   └── video/           # Reproductor, Comentarios, Notas
├── db/
│   ├── schema.ts        # Tablas: users, courses, lessons, progress, comments, notes, access
│   └── index.ts         # Conexión Neon vía driver HTTP serverless
└── lib/
    ├── auth.ts          # Helpers: requireAuth, isAdmin, syncClerkUser
    ├── mailerlite.ts    # API wrapper para MailerLite
    ├── presigned.ts     # Generación de URLs firmadas MEGA S4
    └── s3.ts            # Cliente S3 configurado para MEGA S4
```

---

## 🛡️ Arquitectura de Seguridad

### Streaming Anti-Piratería
1. **Proxy de Manifiestos** (`/api/video/manifest`): Nunca se expone la URL real de MEGA S4. El servidor genera una Presigned URL que expira en 30 minutos.
2. **Watermark Dinámico**: El email del alumno se renderiza en CSS sobre el vídeo con 5% de opacidad.
3. **Rate Limiter**: Más de 50 peticiones al manifest en 5 minutos → cuenta suspendida automáticamente en Neon (campo `is_suspended`).

### Control de Acceso
- Las rutas privadas están protegidas por `proxy.ts` (basado en Clerk Middleware).
- Las APIs del admin verifican doble: autenticación + rol `admin` en `publicMetadata` de Clerk.
- Los accesos a cursos se comprueban en servidor antes de mostrar el reproductor.

---

## 👑 Cómo Convertirte en Admin

1. Ve a [clerk.com](https://clerk.com) → Dashboard de tu aplicación.
2. Entra en **Users** y pincha en tu cuenta.
3. Edita **Public Metadata** y añade:
   ```json
   { "role": "admin" }
   ```
4. Refresca la sesión y ya puedes acceder a `/admin`.

---

## 🏗️ Configurar Webhooks (Para Sincronización Automática)

### Clerk Webhook (Sincronizar usuarios con Neon)
1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://tu-dominio.com/api/webhooks/clerk`
3. Eventos: `user.created`, `user.updated`, `user.deleted`
4. Copia el **Signing Secret** → pégalo en `CLERK_WEBHOOK_SECRET`

### Hotmart Webhook (Automatizar accesos al comprar)
1. Hotmart → **Ferramentas** → **Webhooks**
2. URL: `https://tu-dominio.com/api/webhooks/hotmart`
3. Copia el **Hottok** → pégalo en `HOTMART_WEBHOOK_SECRET`
4. En el webhook de Hotmart, el campo `data.product.id` debe coincidir con el `id` del curso en Neon.

---

## 🎬 Subir un Nuevo Curso (Flujo Completo)

```bash
# 1. Grabar y codificar con FFmpeg (AV1 + HLS)
./scripts/encode_course.sh nombre-del-curso ruta/al/video.mp4

# 2. Subir la carpeta generada a MEGA S4
#    Estructura: nombre-del-curso/leccion-01/master.m3u8
#                nombre-del-curso/leccion-01/thumbnail.webp

# 3. Crear el curso en el panel Admin
#    → http://localhost:3000/admin/cursos → Crear Nuevo Curso

# 4. Añadir lecciones con la ruta del M3U8
#    → /admin/lecciones → Nueva Lección → Pegar ruta MEGA S4

# 5. Publicar el curso (toggle en /admin/cursos)
```

---

## 🚢 Despliegue en Vercel

```bash
# Pre-requisito: instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod

# O simplemente hacer push a main (GitHub Actions via vercel.json)
git push origin main
```

**Variables de entorno en producción:** Vercel Dashboard → Settings → Environment Variables.  
Recuerda actualizar `NEXT_PUBLIC_APP_URL` con tu dominio real y configurar el CORS en MEGA S4.

---

## ⚠️ Avisos Conocidos

- **"Clerk development keys"**: Normal en local. Desaparece al usar claves de producción en Vercel.
- **MEGA S4 CORS**: Antes de que funcione el vídeo en producción, configurar el fichero `scripts/cors-config.json` apuntando a tu dominio.
- **Hotmart Product ID**: El `data.product.id` del webhook de Hotmart debe ser igual al UUID del curso en Neon, o adaptar el mapeo en el webhook.
