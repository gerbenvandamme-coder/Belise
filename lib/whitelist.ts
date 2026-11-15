import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/schedule';

/** Welke dagen boekbaar zijn volgens de whitelist. Alles wat hier niet in staat, is gesloten. */
export type OpenDays = {
  /** Vaste werkdagen (0 = zondag ... 6 = zaterdag) met is_active = true. */
  weekdays: ReadonlySet<number>;
  /** Datums ('YYYY-MM-DD') die via een override extra zijn opengezet. */
  opened: ReadonlySet<string>;
  /** Datums ('YYYY-MM-DD') die via een override zijn gesloten. */
  closed: ReadonlySet<string>;
};

export const NO_OPEN_DAYS: OpenDays = {
  weekdays: new Set<number>(),
  opened: new Set<string>(),
  closed: new Set<string>(),
};

const LOAD_ERROR = 'De beschikbaarheid kon niet worden geladen. Probeer het opnieuw.';
const SLOTS_ERROR = 'De beschikbare uren konden niet worden geladen. Probeer het opnieuw.';

/** Een override wint altijd van het weekrooster. */
export function isDayOpen(date: Date, openDays: OpenDays): boolean {
  const key = toDateKey(date);
  if (openDays.closed.has(key)) return false;
  if (openDays.opened.has(key)) return true;
  return openDays.weekdays.has(date.getDay());
}

/** Leest het weekrooster en de overrides vanaf `fromDateKey` rechtstreeks uit Supabase (EU). */
export async function loadOpenDays(fromDateKey: string): Promise<OpenDays> {
  const [weekly, overrides] = await Promise.all([
    supabase.from('weekly_availability').select('day_of_week').eq('is_active', true),
    supabase
      .from('date_overrides')
      .select('specific_date, is_available')
      .gte('specific_date', fromDateKey),
  ]);

  if (weekly.error || overrides.error) {
    throw new Error(LOAD_ERROR);
  }

  const opened = new Set<string>();
  const closed = new Set<string>();
  for (const row of overrides.data ?? []) {
    (row.is_available ? opened : closed).add(row.specific_date);
  }

  return {
    weekdays: new Set((weekly.data ?? []).map((row) => row.day_of_week)),
    opened,
    closed,
  };
}

/** Vrije starttijden ('HH:MM') voor een dag en behandelduur, berekend door de database. */
export async function fetchAvailableSlots(date: Date, durationMinutes: number): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: toDateKey(date),
    p_duration_min: durationMinutes,
  });

  if (error) {
    throw new Error(SLOTS_ERROR);
  }

  return (data ?? []).map((row) => row.slot_time.slice(0, 5));
}

/** 'HH:MM' + minuten, bv. voor het eindtijdstip van een boeking. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}