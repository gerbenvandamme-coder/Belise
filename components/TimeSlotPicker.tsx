'use client';

import { useMemo } from 'react';
import { toDateKey } from './BookingCalendar';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

/** Een bestaande afspraak. `date` is 'YYYY-MM-DD' en `start` is 'HH:MM'. */
export type Reservation = {
  date: string;
  start: string;
  durationMinutes: number;
  status: ReservationStatus;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

const WORK_START_MINUTES = 9 * 60;
const WORK_END_MINUTES = 18 * 60;
const SLOT_STEP_MINUTES = 15;
const BUFFER_MINUTES = 15;
const BLOCKING_STATUSES: ReadonlySet<ReservationStatus> = new Set(['pending', 'confirmed']);
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type BusyInterval = { start: number; end: number };

function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

type GenerateSlotsOptions = {
  date: Date;
  durationMinutes: number;
  reservations: readonly Reservation[];
  now: Date;
};

/**
 * Maakt slots van 15 minuten binnen de werkuren. Een slot is volzet als de afspraak,
 * met 15 minuten buffer aan beide kanten, een bestaande afspraak raakt.
 * Tijden die al voorbij zijn op de gekozen dag worden weggelaten.
 */
export function generateSlots({
  date,
  durationMinutes,
  reservations,
  now,
}: GenerateSlotsOptions): TimeSlot[] {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return [];

  const key = toDateKey(date);
  const busy: BusyInterval[] = [];

  for (const reservation of reservations) {
    if (reservation.date !== key || !BLOCKING_STATUSES.has(reservation.status)) continue;
    const start = parseTime(reservation.start);
    if (start === null || reservation.durationMinutes <= 0) continue;
    busy.push({ start, end: start + reservation.durationMinutes });
  }

  const nowMinutes = toDateKey(now) === key ? now.getHours() * 60 + now.getMinutes() : null;
  const slots: TimeSlot[] = [];

  for (
    let start = WORK_START_MINUTES;
    start + durationMinutes <= WORK_END_MINUTES;
    start += SLOT_STEP_MINUTES
  ) {
    if (nowMinutes !== null && start < nowMinutes) continue;

    const conflicts = busy.some(
      (interval) =>
        start < interval.end + BUFFER_MINUTES &&
        start + durationMinutes + BUFFER_MINUTES > interval.start,
    );

    slots.push({ time: formatTime(start), available: !conflicts });
  }

  return slots;
}

type TimeSlotPickerProps = {
  date: Date | null;
  durationMinutes: number;
  reservations: readonly Reservation[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
};

export default function TimeSlotPicker({
  date,
  durationMinutes,
  reservations,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  const slots = useMemo(
    () =>
      date
        ? generateSlots({ date, durationMinutes, reservations, now: new Date() })
        : [],
    [date, durationMinutes, reservations],
  );

  if (!date) {
    return <p className="text-sm text-primary/60">Kies eerst een dag in de kalender.</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-primary/60">
        Er zijn op deze dag geen tijdslots meer beschikbaar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-primary/60">
        Duur van de behandeling: {durationMinutes} min, met 15 min buffer na de afspraak.
      </p>

      <div role="group" aria-label="Beschikbare tijdslots" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const selected = slot.available && slot.time === selectedTime;

          if (!slot.available) {
            return (
              <button
                key={slot.time}
                type="button"
                disabled
                aria-label={`${slot.time}, volzet`}
                className="flex flex-col items-center rounded-full border border-taupe/30 px-3 py-2 text-sm text-primary/35 cursor-not-allowed"
              >
                <span className="line-through decoration-primary/30">{slot.time}</span>
                <span className="text-[0.6rem] uppercase tracking-[0.12em]">volzet</span>
              </button>
            );
          }

          return (
            <button
              key={slot.time}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectTime(slot.time)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] ${
                selected
                  ? 'border-accent bg-accent text-white'
                  : 'border-taupe/50 text-primary hover:border-accent hover:bg-accent-soft'
              }`}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}