import { describeDesign } from '@/lib/bookings/design';
import { formatTime, parseTime } from '@/lib/bookings/availability';
import type { Appointment } from '@/lib/bookings/types';
import { SALON } from '@/lib/salon';

export type EmailContent = { subject: string; html: string; text: string };

type Row = [label: string, value: string];

const COLORS = {
  ink: '#1C1917',
  paper: '#F5F0E8',
  taupe: '#D4B8A5',
  line: '#EEE6DA',
  muted: '#6B635C',
  warningBg: '#FBF3E6',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const ADDRESS = `${SALON.address.street}, ${SALON.address.postalCity}`;
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

const DATE_FORMATTER = new Intl.DateTimeFormat('nl-BE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// De entiteiten staan als \u0026 geschreven, zodat een editor of tool ze niet terug kan decoderen naar het kale teken.
const HTML_ESCAPES: Record<string, string> = {
  '\u0026': '\u0026amp;',
  '\u003c': '\u0026lt;',
  '\u003e': '\u0026gt;',
  '\u0022': '\u0026quot;',
  '\u0027': '\u0026#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

function formatDate(appointment: Appointment): string {
  const text = DATE_FORMATTER.format(appointment.date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTimeRange(appointment: Appointment): string {
  const start = parseTime(appointment.startTime) ?? 0;
  return `${appointment.startTime} – ${formatTime(start + appointment.duration)}`;
}

function appointmentRows(appointment: Appointment): Row[] {
  return [
    ['Behandeling', appointment.service],
    ['Datum', formatDate(appointment)],
    ['Tijd', formatTimeRange(appointment)],
    ['Behandelduur', `${appointment.duration} minuten`],
    ['Adres', ADDRESS],
  ];
}

function rowsHtml(rows: readonly Row[]): string {
  const cells = rows
    .map(
      ([label, value]) => `<tr>
<td style="padding:12px 16px 12px 0;border-bottom:1px solid ${COLORS.line};font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.muted};vertical-align:top;width:36%;">${escapeHtml(label)}</td>
<td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-family:${SANS};font-size:15px;color:${COLORS.ink};vertical-align:top;">${escapeHtml(value)}</td>
</tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:28px 0;">${cells}</table>`;
}

function rowsText(rows: readonly Row[]): string {
  return rows.map(([label, value]) => `${label}: ${value}`).join('\n');
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.ink};">${escapeHtml(text)}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 24px;font-family:${SERIF};font-size:30px;font-weight:400;line-height:1.2;color:${COLORS.ink};">${escapeHtml(text)}</h1>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td style="border-radius:999px;background:${COLORS.ink};">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:16px 36px;font-family:${SANS};font-size:15px;font-weight:600;letter-spacing:0.04em;color:#FFFFFF;text-decoration:none;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function layout(title: string, preheader: string, content: string): string {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#FFFFFF;border-radius:20px;">
<tr><td style="padding:44px 40px;">
<p style="margin:0 0 32px;font-family:${SANS};font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:${COLORS.taupe};">${escapeHtml(SALON.name)}</p>
${content}
</td></tr>
</table>
<p style="margin:24px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};text-align:center;">${escapeHtml(SALON.name)} · ${escapeHtml(ADDRESS)}</p>
</td></tr>
</table>
</body>
</html>`;
}

function firstName(appointment: Appointment): string {
  return appointment.clientName.split(/\s+/)[0] ?? appointment.clientName;
}

/** E-mail 1: vraagt de klant om de afspraak binnen 15 minuten te bevestigen. */
export function buildConfirmationRequestEmail(
  appointment: Appointment,
  confirmUrl: string,
): EmailContent {
  const subject = 'Bevestig je afspraak bij Belise (Opwijk)';
  const rows = appointmentRows(appointment);
  const warning = 'Bevestig binnen 15 minuten, anders vervalt je gereserveerde tijdslot automatisch.';

  const html = layout(
    subject,
    'Eén klik om je tijdslot vast te leggen.',
    `${heading('Bevestig je afspraak')}
${paragraph(`Hallo ${firstName(appointment)}, we hebben een tijdslot voor je gereserveerd. Controleer de gegevens en bevestig met de knop hieronder.`)}
${rowsHtml(rows)}
${button(confirmUrl, 'Bevestig mijn afspraak')}
<div style="margin:0 0 24px;padding:16px 20px;border-radius:12px;background:${COLORS.warningBg};font-family:${SANS};font-size:14px;line-height:1.55;color:${COLORS.ink};">${escapeHtml(warning)}</div>
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">Werkt de knop niet? Kopieer deze link in je browser:<br><span style="word-break:break-all;">${escapeHtml(confirmUrl)}</span></p>`,
  );

  const text = `Hallo ${firstName(appointment)},

We hebben een tijdslot voor je gereserveerd.

${rowsText(rows)}

Bevestig mijn afspraak: ${confirmUrl}

${warning}`;

  return { subject, html, text };
}

/** E-mail 2: definitieve bevestiging voor de klant, met adres en parkeerinfo. De .ics is een bijlage. */
export function buildConfirmedEmail(appointment: Appointment): EmailContent {
  const subject = 'Je afspraak bij Belise is bevestigd';
  const rows = appointmentRows(appointment);

  const html = layout(
    subject,
    'Tot binnenkort in Opwijk.',
    `${heading('Je afspraak is bevestigd')}
${paragraph(`Hallo ${firstName(appointment)}, we kijken ernaar uit je te ontvangen.`)}
${rowsHtml(rows)}
<p style="margin:0 0 8px;font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.muted};">Parkeren</p>
${paragraph(SALON.parking)}
<p style="margin:0 0 24px;font-family:${SANS};font-size:14px;"><a href="${escapeHtml(MAPS_URL)}" style="color:${COLORS.ink};">Route in Google Maps</a></p>
${paragraph('In de bijlage vind je een kalenderbestand (.ics). Open het om de afspraak aan je agenda toe te voegen.')}`,
  );

  const text = `Hallo ${firstName(appointment)},

Je afspraak is bevestigd.

${rowsText(rows)}

Parkeren: ${SALON.parking}
Route: ${MAPS_URL}

In de bijlage vind je een kalenderbestand (.ics) voor je agenda.`;

  return { subject, html, text };
}

/** E-mail 3: notificatie voor de eigenares met klantgegevens en configurator-ontwerp. */
export function buildOwnerNotificationEmail(appointment: Appointment): EmailContent {
  const subject = `Nieuwe afspraak: ${appointment.clientName}, ${formatDate(appointment)} om ${appointment.startTime}`;

  const clientRows: Row[] = [
    ['Klant', appointment.clientName],
    ['E-mail', appointment.clientEmail],
    ['Telefoon', appointment.clientPhone],
  ];
  const appointmentOnlyRows = appointmentRows(appointment).filter(([label]) => label !== 'Adres');
  const designRows = appointment.design ? describeDesign(appointment.design) : [];

  const designHtml = appointment.design
    ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.muted};">Nagelontwerp uit de configurator</p>${rowsHtml(designRows)}`
    : paragraph('De klant heeft geen ontwerp uit de configurator meegestuurd.');

  const html = layout(
    subject,
    `${appointment.clientName} heeft de afspraak bevestigd.`,
    `${heading('Nieuwe bevestigde afspraak')}
${rowsHtml([...clientRows, ...appointmentOnlyRows])}
${designHtml}`,
  );

  const text = `Nieuwe bevestigde afspraak

${rowsText([...clientRows, ...appointmentOnlyRows])}

${
  appointment.design
    ? `Nagelontwerp uit de configurator:\n${rowsText(designRows)}`
    : 'Geen ontwerp uit de configurator meegestuurd.'
}`;

  return { subject, html, text };
}