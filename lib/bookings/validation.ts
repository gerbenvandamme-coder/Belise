import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  getSalonNow,
  isValidSlotStart,
  parseTime,
} from './availability';
import { parseDesign } from './design';
import type { NewAppointment } from './store';
import { isClosedDay, parseDateKey } from '@/lib/schedule';

export type ParsedReserveInput = { ok: true; value: NewAppointment } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9 ()./-]{6,20}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length < min || text.length > max || CONTROL_CHARS.test(text)) return null;
  return text;
}

export function parseReserveInput(body: unknown, now: Date = new Date()): ParsedReserveInput {
  if (!isRecord(body)) return { ok: false, error: 'Ongeldige aanvraag.' };

  const clientName = readText(body.clientName, 2, 100);
  if (!clientName) return { ok: false, error: 'Vul je naam in (2 tot 100 tekens).' };

  const clientEmail = readText(body.clientEmail, 5, 254);
  if (!clientEmail || !EMAIL_PATTERN.test(clientEmail)) {
    return { ok: false, error: 'Vul een geldig e-mailadres in.' };
  }

  const clientPhone = readText(body.clientPhone, 6, 20);
  if (!clientPhone || !PHONE_PATTERN.test(clientPhone)) {
    return { ok: false, error: 'Vul een geldig telefoonnummer in.' };
  }

  const service = readText(body.service, 1, 100);
  if (!service) return { ok: false, error: 'Kies een behandeling.' };

  const duration = body.duration;
  if (
    typeof duration !== 'number' ||
    !Number.isInteger(duration) ||
    duration < MIN_DURATION_MINUTES ||
    duration > MAX_DURATION_MINUTES
  ) {
    return { ok: false, error: 'Ongeldige behandelduur.' };
  }

  const dateKey = typeof body.date === 'string' ? body.date : '';
  const date = parseDateKey(dateKey);
  if (!date) return { ok: false, error: 'Ongeldige datum.' };

  const salonNow = getSalonNow(now);
  if (dateKey < salonNow.dateKey) {
    return { ok: false, error: 'Deze datum ligt in het verleden.' };
  }
  if (isClosedDay(date)) {
    return { ok: false, error: 'De salon is op deze dag gesloten.' };
  }

  const startTime = typeof body.startTime === 'string' ? body.startTime : '';
  const startMinutes = parseTime(startTime);
  if (startMinutes === null || !isValidSlotStart(startMinutes, duration)) {
    return { ok: false, error: 'Dit tijdstip valt buiten de werkuren.' };
  }
  if (dateKey === salonNow.dateKey && startMinutes < salonNow.minutes) {
    return { ok: false, error: 'Dit tijdstip is al voorbij.' };
  }

  const design = parseDesign(body.design);
  if (!design.ok) return { ok: false, error: 'Ongeldig nagelontwerp.' };

  return {
    ok: true,
    value: {
      clientName,
      clientEmail,
      clientPhone,
      service,
      design: design.design,
      dateKey,
      startTime,
      duration,
    },
  };
}