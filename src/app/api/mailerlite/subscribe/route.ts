import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/mailerlite';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return new NextResponse('Email es obligatorio', { status: 400 });
    }

    const success = await subscribeToNewsletter(email, name);

    if (success) {
      return NextResponse.json({ success: true, message: 'Suscrito con éxito' });
    } else {
      return new NextResponse('Error al suscribir', { status: 400 });
    }
  } catch (error) {
    console.error('[API_MAILERLITE_SUBSCRIBE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
