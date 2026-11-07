import { randomBytes, randomUUID } from 'node:crypto';
import { conflictsWithBusy, parseTime, type BusyInterval } from './availability';
import { appointmentDateKey, type Appointment, type NailDesign } from './types';

/**
 * In-memory store voor test en ontwikkeling. De data verdwijnt bij een herstart en wordt niet
 * gedeeld tussen serverless instances. Vervang dit bestand door Prisma of Supabase in productie.
 * De exports hieronder zijn de enige toegang tot de data, dus de routes hoeven niet te veranderen.
 */

export const PENDING_TTL_MS = 15 * 60 * 1000;
export const MAX_PENDING_PER_EMAIL = 2;

const TOKEN_BYTES = 24; // 24 bytes in base64url zijn precies 32 tekens.
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const BLOCKING_STATUSES = new Set<Appointment['status']>(['PENDING', 'CONFIRMED']);

type StoreState = {
  byId: Map<string, Appointment>;
  idByToken: Map<string, string>;
};

// Houd één store vast over hot reloads van Next.js heen.
const globalForStore = globalThis as typeof globalThis & { __beliseBookings?: StoreState };
const state: StoreState = (globalForStore.__beliseBookings ??= {
  byId: new Map(),
  idByToken: new Map(),
});

export type NewAppointment = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  design: NailDesign | null;
  /** 'YYYY-MM-DD' */
  dateKey: string;
  /** 'HH:MM' */
  startTime: string;
  duration: number;
};

export type ReserveResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: 'slot-taken' | 'too-many-pending' };

export type ConfirmResult =
  | { outcome: 'confirmed'; appointment: Appointment }
  | { outcome: 'already-confirmed'; appointment: Appointment }
  | { outcome: 'expired' }
  | { outcome: 'invalid' };

function generateToken(): string {
  let token = randomBytes(TOKEN_BYTES).toString('base64url');
  while (state.idByToken.has(token)) token = randomBytes(TOKEN_BYTES).toString('base64url');
  return token;
}

/** Markeert alle PENDING afspraken waarvan expiresAt voorbij is als EXPIRED. */
export function expireStalePending(now: Date = new Date()): number {
  let expired = 0;
  for (const appointment of state.byId.values()) {
    if (appointment.status === 'PENDING' && appointment.expiresAt.getTime() < now.getTime()) {
      state.byId.set(appointment.id, { ...appointment, status: 'EXPIRED' });
      expired++;
    }
  }
  return expired;
}

/** Bezette intervallen (PENDING en CONFIRMED) op een dag. Ruimt eerst verlopen afspraken op. */
export function getBusyIntervals(dateKey: string, now: Date = new Date()): BusyInterval[] {
  expireStalePending(now);

  const busy: BusyInterval[] = [];
  for (const appointment of state.byId.values()) {
    if (!BLOCKING_STATUSES.has(appointment.status)) continue;
    if (appointmentDateKey(appointment) !== dateKey) continue;

    const start = parseTime(appointment.startTime);
    if (start === null) continue;
    busy.push({ start, end: start + appointment.duration });
  }
  return busy;
}

/**
 * Controleert het tijdslot en maakt de afspraak aan. Alles gebeurt synchroon,
 * dus twee gelijktijdige aanvragen kunnen niet hetzelfde slot pakken.
 */
export function createPending(input: NewAppointment, now: Date = new Date()): ReserveResult {
  const start = parseTime(input.startTime);
  if (start === null) throw new Error('Ongeldige starttijd.');

  const busy = getBusyIntervals(input.dateKey, now); // voert ook de cleanup uit
  if (conflictsWithBusy(start, input.duration, busy)) {
    return { ok: false, reason: 'slot-taken' };
  }

  const email = input.clientEmail.toLowerCase();
  let pendingForEmail = 0;
  for (const appointment of state.byId.values()) {
    if (appointment.status === 'PENDING' && appointment.clientEmail.toLowerCase() === email) {
      pendingForEmail++;
    }
  }
  if (pendingForEmail >= MAX_PENDING_PER_EMAIL) {
    return { ok: false, reason: 'too-many-pending' };
  }

  const appointment: Appointment = {
    id: randomUUID(),
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    service: input.service,
    design: input.design,
    date: new Date(`${input.dateKey}T00:00:00.000Z`),
    startTime: input.startTime,
    duration: input.duration,
    status: 'PENDING',
    verificationToken: generateToken(),
    expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
    createdAt: now,
  };

  state.byId.set(appointment.id, appointment);
  state.idByToken.set(appointment.verificationToken, appointment.id);
  return { ok: true, appointment };
}

/** Zet een PENDING afspraak op CANCELLED, bijvoorbeeld als de bevestigingsmail niet verstuurd kon worden. */
export function cancelPending(id: string): void {
  const appointment = state.byId.get(id);
  if (appointment?.status === 'PENDING') {
    state.byId.set(id, { ...appointment, status: 'CANCELLED' });
  }
}

export function confirmByToken(token: string, now: Date = new Date()): ConfirmResult {
  const id = state.idByToken.get(token);
  const appointment = id ? state.byId.get(id) : undefined;
  if (!appointment) return { outcome: 'invalid' };

  switch (appointment.status) {
    case 'CONFIRMED':
      return { outcome: 'already-confirmed', appointment };
    case 'EXPIRED':
      return { outcome: 'expired' };
    case 'CANCELLED':
      return { outcome: 'invalid' };
    case 'PENDING': {
      if (appointment.expiresAt.getTime() < now.getTime()) {
        state.byId.set(appointment.id, { ...appointment, status: 'EXPIRED' });
        return { outcome: 'expired' };
      }
      const confirmed: Appointment = { ...appointment, status: 'CONFIRMED' };
      state.byId.set(confirmed.id, confirmed);
      return { outcome: 'confirmed', appointment: confirmed };
    }
  }
}