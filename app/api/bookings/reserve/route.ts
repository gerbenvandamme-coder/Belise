import { NextResponse, type NextRequest } from 'next/server';
import { cancelPending, createPending } from '@/lib/bookings/store';
import { parseReserveInput } from '@/lib/bookings/validation';
import { getSiteUrl } from '@/lib/config';
import { sendEmail } from '@/lib/email/send';
import { buildConfirmationRequestEmail } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Ongeldige aanvraag.', 400);
  }

  const parsed = parseReserveInput(body);
  if (!parsed.ok) return errorResponse(parsed.error, 400);

  const result = createPending(parsed.value);
  if (!result.ok) {
    return result.reason === 'slot-taken'
      ? errorResponse('Dit tijdslot is net volzet. Kies een ander tijdstip.', 409)
      : errorResponse(
          'Je hebt al openstaande reserveringen. Bevestig die eerst of wacht tot ze vervallen.',
          429,
        );
  }

  const { appointment } = result;

  try {
    const baseUrl = getSiteUrl(request.nextUrl.origin);
    const confirmUrl = `${baseUrl}/api/bookings/verify?token=${encodeURIComponent(appointment.verificationToken)}`;
    const email = buildConfirmationRequestEmail(appointment, confirmUrl);

    await sendEmail({ to: appointment.clientEmail, ...email });
  } catch (error) {
    // Zonder mail kan de klant niet bevestigen, dus geef het tijdslot meteen weer vrij.
    cancelPending(appointment.id);
    console.error(
      'Bevestigingsmail versturen mislukt:',
      error instanceof Error ? error.message : error,
    );
    return errorResponse(
      'De bevestigingsmail kon niet worden verstuurd. Probeer het later opnieuw.',
      502,
    );
  }

  // Het token gaat bewust alleen per mail naar de klant en zit niet in dit antwoord.
  return NextResponse.json(
    {
      id: appointment.id,
      status: appointment.status,
      expiresAt: appointment.expiresAt.toISOString(),
    },
    { status: 201 },
  );
}