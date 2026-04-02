import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Este webhook se dispara AUTOMÁTICAMENTE por Clerk cada vez que:
// - Un usuario se registra  → event: 'user.created'
// - Un usuario actualiza su perfil → event: 'user.updated'
// - Un usuario se borra → event: 'user.deleted'
//
// Para activarlo: Clerk Dashboard → Webhooks → Add Endpoint
// URL: https://tu-dominio.com/api/webhooks/clerk
// Signing Secret → pegar en CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET no configurado en .env.local');
    return new NextResponse('Config error', { status: 500 });
  }

  // Verificar la firma de Svix (que el mensaje venga de Clerk y no de alguien ajeno)
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Verificación de firma fallida:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;
  const email = email_addresses?.[0]?.email_address ?? '';

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    await db.insert(users)
      .values({
        id,
        email,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        avatarUrl: image_url ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
          avatarUrl: image_url ?? null,
          updatedAt: new Date(),
        },
      });
    console.log(`[CLERK_WEBHOOK] Upsert usuario ${id} (${email}) OK`);
  }

  if (evt.type === 'user.deleted') {
    await db.delete(users).where(eq(users.id, id));
    console.log(`[CLERK_WEBHOOK] Usuario ${id} eliminado de Neon`);
  }

  return NextResponse.json({ received: true });
}
