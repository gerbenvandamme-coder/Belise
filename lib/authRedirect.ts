/** Standaardbestemming na het inloggen. */
export const DEFAULT_AFTER_LOGIN = '/account';

/**
 * Laat alleen paden binnen deze site toe, zodat `?next=` geen open redirect wordt.
 * Valt terug op `fallback` bij een leeg, extern of vreemd gevormd pad.
 */
export function safeNextPath(value: string | null, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  // Browsers verwijderen tabs en regeleinden uit URL's, dus "/\t/evil.nl" zou "//evil.nl" worden.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = 'http://localhost';
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}