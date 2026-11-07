export const WORK_START_MINUTES = 9 * 60;
export const WORK_END_MINUTES = 18 * 60;
export const SLOT_STEP_MINUTES = 15;
export const BUFFER_MINUTES = 15;
export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 8 * 60;

const SALON_TIME_ZONE = 'Europe/Brussels';
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const salonClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALON_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export type BusyInterval = { start: number; end: number };

export function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Huidige datum ('YYYY-MM-DD') en minuten sinds middernacht in de salontijdzone. */
export function getSalonNow(now: Date = new Date()): { dateKey: string; minutes: number } {
  const parts: Record<string, string> = {};
  for (const part of salonClock.formatToParts(now)) parts[part.type] = part.value;

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Een starttijd moet op het raster van 15 minuten liggen en de behandeling moet voor sluitingstijd eindigen. */
export function isValidSlotStart(startMinutes: number, durationMinutes: number): boolean {
  return (
    startMinutes >= WORK_START_MINUTES &&
    startMinutes % SLOT_STEP_MINUTES === 0 &&
    startMinutes + durationMinutes <= WORK_END_MINUTES
  );
}

/**
 * Zelfde regel als TimeSlotPicker: de nieuwe afspraak, met buffer aan beide kanten,
 * mag geen bestaande afspraak raken.
 */
export function conflictsWithBusy(
  startMinutes: number,
  durationMinutes: number,
  busy: readonly BusyInterval[],
): boolean {
  return busy.some(
    (interval) =>
      startMinutes < interval.end + BUFFER_MINUTES &&
      startMinutes + durationMinutes + BUFFER_MINUTES > interval.start,
  );
}