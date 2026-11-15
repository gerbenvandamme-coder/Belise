import { parseDesign } from '@/lib/bookings/design';
import type { NailDesign } from '@/lib/bookings/types';

/**
 * Bewaart het ontwerp uit /designer tot de klant een afspraak boekt.
 * sessionStorage overleeft de login via /account in hetzelfde tabblad.
 */
const STORAGE_KEY = 'belise.nailDesign';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function saveNailDesign(design: NailDesign): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ design, savedAt: Date.now() }));
  } catch {
    // Opslag geblokkeerd (privémodus): de klant kan het ontwerp nog downloaden.
  }
}

export function clearNailDesign(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Niets te wissen.
  }
}

export function loadNailDesign(): NailDesign | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { design, savedAt } = parsed as { design?: unknown; savedAt?: unknown };
    if (typeof savedAt !== 'number' || Date.now() - savedAt > MAX_AGE_MS) {
      clearNailDesign();
      return null;
    }
    const result = parseDesign(design);
    return result.ok ? result.design : null;
  } catch {
    return null;
  }
}
