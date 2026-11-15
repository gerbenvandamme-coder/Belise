import { LENGTH_OPTIONS, LENGTH_LABELS, type LengthOption } from '@/lib/treatments';
import type { BookingStatus, Json } from '@/lib/database.types';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'In afwachting',
  confirmed: 'Bevestigd',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
  no_show: 'No-show',
};

export type TreatmentLine = {
  label: string;
  priceEuro: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLengthOption(value: unknown): value is LengthOption {
  return typeof value === 'string' && (LENGTH_OPTIONS as readonly string[]).includes(value);
}

/** Leest de behandelingen uit bookings.treatments. Onbekende vormen geven een lege regel terug, geen fout. */
export function parseTreatments(value: Json): TreatmentLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): TreatmentLine[] => {
    if (!isRecord(item)) return [];

    const title =
      typeof item.title === 'string' && item.title.trim() ? item.title : 'Onbekende behandeling';
    const label = isLengthOption(item.length) ? `${title} (${LENGTH_LABELS[item.length]})` : title;
    const priceEuro = typeof item.priceEuro === 'number' ? item.priceEuro : null;

    return [{ label, priceEuro }];
  });
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
}

/** Verwacht 'HH:MM:SS' of 'HH:MM' en geeft 'HH:MM'. */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** Verwacht een datumsleutel 'YYYY-MM-DD'. */
export function formatDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}