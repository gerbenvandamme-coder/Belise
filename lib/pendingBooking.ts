/**
 * Bewaart de gekozen boeking tijdelijk in sessionStorage terwijl de klant inlogt via een magic link.
 * Foto's (File-objecten) kunnen hier niet in; die kiest de klant na het inloggen opnieuw.
 */
const STORAGE_KEY = 'belise.pendingBooking';
const MAX_AGE_MS = 60 * 60 * 1000;

export type PendingBooking = {
  selectedIds: string[];
  /** Behandeling-id naar gekozen haarlengte. */
  lengthById: Record<string, string>;
  /** 'YYYY-MM-DD' */
  dateKey: string;
  time: string;
  clientNotes: string;
  photoSocialConsent: boolean;
};

type StoredPendingBooking = PendingBooking & { savedAt: number };

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

export function savePendingBooking(booking: PendingBooking): void {
  try {
    const stored: StoredPendingBooking = { ...booking, savedAt: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // sessionStorage kan geblokkeerd zijn (privémodus). De klant kiest dan opnieuw.
  }
}

export function clearPendingBooking(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Niets te wissen als opslag niet beschikbaar is.
  }
}

export function loadPendingBooking(): PendingBooking | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;

    if (typeof candidate.savedAt !== 'number' || Date.now() - candidate.savedAt > MAX_AGE_MS) {
      clearPendingBooking();
      return null;
    }

    const { selectedIds, lengthById, dateKey, time, clientNotes, photoSocialConsent } = candidate;
    if (
      !Array.isArray(selectedIds) ||
      !selectedIds.every((id): id is string => typeof id === 'string') ||
      !isStringRecord(lengthById) ||
      typeof dateKey !== 'string' ||
      typeof time !== 'string' ||
      typeof clientNotes !== 'string' ||
      typeof photoSocialConsent !== 'boolean'
    ) {
      return null;
    }

    return { selectedIds, lengthById, dateKey, time, clientNotes, photoSocialConsent };
  } catch {
    return null;
  }
}