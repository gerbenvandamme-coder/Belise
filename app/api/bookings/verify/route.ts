import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_PATTERN, confirmByToken } from '@/lib/bookings/store';
import type { Appointment } from '@/lib/bookings/types';
import { getSiteUrl, requireEnv } from '@/lib/config';
import { buildIcs } from '@/lib/email/ics';
import { sendEmail } from '@/lib/email/send';
import { buildConfirmedEmail, buildOwnerNotificationEmail } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Async, zodat ook een ontbrekende env-variabele als gefaalde promise binnenkomt en niet als throw. */
async function notifyClient(appointment: Appointment): Promise<void> {
  const email = buildConfirmedEmail(appointment);
  await sendEmail({
    to: appointment.clientEmail,
    ...email,
    attachments: [
      { filename: 'afspraak-belise.ics', content: Buffer.from(buildIcs(appointment), 'utf-8') },
    ],
  });
}

async function notifyOwner(appointment: Appointment): Promise<void> {
  const email = buildOwnerNotificationEmail(appointment);
  await sendEmail({
    to: requireEnv('OWNER_EMAIL'),
    ...email,
    replyTo: appointment.clientEmail,
  });
}

async function sendConfirmationEmails(appointment: Appointment): Promise<void> {
  // De afspraak is al bevestigd. Een mislukte mail mag de klant niet blokkeren, maar moet zichtbaar zijn.
  const results = await Promise.allSettled([notifyClient(appointment), notifyOwner(appointment)]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const target = index === 0 ? 'klant' : 'eigenares';
      const reason = result.reason instanceof Error ? result.reason.message : result.reason;
      console.error(`Mail naar ${target} mislukt voor afspraak ${appointment.id}:`, reason);
    }
  });
}

export async function GET(request: NextRequest) {
  const baseUrl = getSiteUrl(request.nextUrl.origin);
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, baseUrl), 303);

  const token = request.nextUrl.searchParams.get('token') ?? '';
  if (!TOKEN_PATTERN.test(token)) return redirectTo('/booking/failed?reason=invalid');

  const result = confirmByToken(token);

  switch (result.outcome) {
    case 'confirmed':
      await sendConfirmationEmails(result.appointment);
      return redirectTo('/booking/success');
    case 'already-confirmed':
      // Wie de link nogmaals opent, krijgt geen tweede reeks mails.
      return redirectTo('/booking/success');
    case 'expired':
      return redirectTo('/booking/failed?reason=expired');
    case 'invalid':
      return redirectTo('/booking/failed?reason=invalid');
  }
}