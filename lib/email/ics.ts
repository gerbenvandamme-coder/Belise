import { formatTime, parseTime } from '@/lib/bookings/availability';
import { appointmentDateKey, type Appointment } from '@/lib/bookings/types';
import { SALON } from '@/lib/salon';

const FOLD_LENGTH = 60;

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Vouwt lange regels op, zoals RFC 5545 vraagt. */
function fold(line: string): string {
  if (line.length <= FOLD_LENGTH) return line;
  const chunks: string[] = [];
  for (let index = 0; index < line.length; index += FOLD_LENGTH) {
    chunks.push(line.slice(index, index + FOLD_LENGTH));
  }
  return chunks.join('\r\n ');
}

function localStamp(dateKey: string, minutes: number): string {
  return `${dateKey.replace(/-/g, '')}T${formatTime(minutes).replace(':', '')}00`;
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Bouwt een .ics-bestand met de afspraak in de tijdzone Europe/Brussels. */
export function buildIcs(appointment: Appointment, now: Date = new Date()): string {
  const dateKey = appointmentDateKey(appointment);
  const start = parseTime(appointment.startTime) ?? 0;
  const end = start + appointment.duration;
  const location = `${SALON.name}, ${SALON.address.street}, ${SALON.address.postalCity}, België`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Belise//Afspraken//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Brussels',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@belise`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=Europe/Brussels:${localStamp(dateKey, start)}`,
    `DTEND;TZID=Europe/Brussels:${localStamp(dateKey, end)}`,
    `SUMMARY:${escapeText(`Afspraak bij ${SALON.name}: ${appointment.service}`)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(`Behandeling: ${appointment.service}\nParkeren: ${SALON.parking}`)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Morgen: afspraak bij ${SALON.name}`)}`,
    'TRIGGER:-PT24H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(fold).join('\r\n')}\r\n`;
}