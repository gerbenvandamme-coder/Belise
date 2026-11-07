const FIXED_HOLIDAYS = ['01-01', '05-01', '07-21', '08-15', '11-01', '11-11', '12-25'] as const;
/** Dagen na Paszondag: Paasmaandag, Hemelvaart en Pinkstermaandag. */
const EASTER_OFFSETS_DAYS = [1, 39, 50] as const;

const holidayCache = new Map<number, ReadonlySet<string>>();

/** Geeft de datum als 'YYYY-MM-DD' in de lokale tijdzone. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Zet 'YYYY-MM-DD' om naar een lokale datum, of null als de waarde geen echte datum is. */
export function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

/** Gregoriaans algoritme (Meeus/Jones/Butcher) voor de datum van Paszondag. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Alle gesloten feestdagen van een jaar als set van 'YYYY-MM-DD'. */
export function getClosedHolidays(year: number): ReadonlySet<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const keys = new Set<string>(FIXED_HOLIDAYS.map((monthDay) => `${year}-${monthDay}`));
  const easter = easterSunday(year);
  for (const offset of EASTER_OFFSETS_DAYS) {
    const holiday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + offset);
    keys.add(toDateKey(holiday));
  }

  holidayCache.set(year, keys);
  return keys;
}

/** Zondagen en feestdagen zijn standaard gesloten. */
export function isClosedDay(date: Date): boolean {
  if (date.getDay() === 0) return true;
  return getClosedHolidays(date.getFullYear()).has(toDateKey(date));
}