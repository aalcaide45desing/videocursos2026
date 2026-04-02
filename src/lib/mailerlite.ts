// lib/mailerlite.ts
// Integra llamadas fáciles a tu cuenta de MailerLite 

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers';

export async function subscribeToNewsletter(email: string, name?: string, groupId?: string) {
  if (!process.env.MAILERLITE_API_KEY || process.env.MAILERLITE_API_KEY === 'TODO') {
    console.warn('[MAILERLITE] API Key no configurada, omitiendo suscripción de:', email);
    return false;
  }

  try {
    const payload: any = {
      email,
      fields: {
        name: name || '',
      },
    };

    // Si queremos meterlo a un grupo específico (e.g. "Compradores Curso X")
    if (groupId) {
      payload.groups = [groupId];
    }

    const response = await fetch(MAILERLITE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MAILERLITE] Fallo al suscribir ${email}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[MAILERLITE] Catch error:', error);
    return false;
  }
}
