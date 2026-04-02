import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCourseAccess, users } from '@/db/schema';
import { clerkClient } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Hotmart envía eventos por Webhook. La verificación se hace normalmente con un TOKEN (Hottok)
// configurado en la plataforma de Hotmart que pasamos por variable de entorno.

export async function POST(req: NextRequest) {
  try {
    const hottok = req.headers.get('x-hotmart-hottok');
    const secret = process.env.HOTMART_WEBHOOK_SECRET;

    if (!secret || hottok !== secret) {
      console.warn('[HOTMART_WEBHOOK] Token inválido o ausente:', hottok);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    const event = payload.event;
    const data = payload.data; // { buyer: { email, name }, product: { id } }

    const buyerEmail = data?.buyer?.email;
    const hotmartProductId = data?.product?.id?.toString();

    if (!buyerEmail || !hotmartProductId) {
      return new NextResponse('Datos de comprador incompletos', { status: 400 });
    }

    // 1. Mapear el ID de Hotmart a nuestro Course ID (Se debe definir en BD)
    // Para el ejemplo, usaremos el mismo ID o asumimos que lo tenemos mapeado.
    // Lo ideal seria tener en "courses" el campo "hotmartProductId"
    const courseId = hotmartProductId; 

    // 2. Comprobar si el usuario existe en Clerk
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ emailAddress: [buyerEmail] });
    
    let userId = '';

    if (clerkUsers.data.length > 0) {
      userId = clerkUsers.data[0].id; // Ya tiene cuenta
    } else {
      // 3. Crear usuario "fantasma" porque acaba de comprar pero nunca se registró en la plataforma
      console.log(`[HOTMART_WEBHOOK] Creando cuenta automática para: ${buyerEmail}`);
      const randomPassword = crypto.randomBytes(12).toString('hex') + 'A1!'; // Contraseña segura temporal
      const newUser = await clerk.users.createUser({
        emailAddress: [buyerEmail],
        firstName: data.buyer.name?.split(' ')[0] || '',
        lastName: data.buyer.name?.split(' ').slice(1).join(' ') || '',
        password: randomPassword,
        skipPasswordChecks: true,
      });
      userId = newUser.id;

      // Fase 6: Llamar a MailerLite para mandarle el email de bienvenida o enviarle un Reset Password
      // Idealmente pasamos un groupId (ej: 'COMPRADORES_BLENDER_2026') sacado de las credenciales de BD.
      const { subscribeToNewsletter } = await import('@/lib/mailerlite');
      await subscribeToNewsletter(buyerEmail, data.buyer.name || '');
    }

    // Insertar/actualizar en nuestra base de datos relacional Neon
    await db.insert(users).values({
      id: userId,
      email: buyerEmail,
      firstName: data.buyer.name?.split(' ')[0] || '',
      lastName: data.buyer.name?.split(' ').slice(1).join(' ') || '',
    }).onConflictDoNothing();

    // 4. Manejar los eventos de compra
    if (event === 'PURCHASE_APPROVED') {
      console.log(`[HOTMART_WEBHOOK] Dando acceso a ${buyerEmail} al curso ${courseId}`);
      await db.insert(userCourseAccess).values({
        userId,
        courseId,
        grantedAt: new Date(),
      }).onConflictDoNothing(); // Si ya lo tiene, no falla
      
      return NextResponse.json({ success: true, message: 'Acceso otorgado' });
    }

    if (event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_CANCELED') {
      console.log(`[HOTMART_WEBHOOK] Revocando acceso a ${buyerEmail} del curso ${courseId}`);
      await db.delete(userCourseAccess).where(
        and(
          eq(userCourseAccess.userId, userId),
          eq(userCourseAccess.courseId, courseId)
        )
      );
      
      return NextResponse.json({ success: true, message: 'Acceso revocado' });
    }

    // Otros eventos ignorados
    return NextResponse.json({ success: true, message: 'Evento ignorado' });
    
  } catch (error) {
    console.error('[HOTMART_WEBHOOK_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
