/**
 * Basis-URL voor links in e-mails en redirects.
 * In productie is SITE_URL verplicht. De request-origin is daar niet betrouwbaar genoeg,
 * want een vervalste Host-header zou anders links naar een ander domein in de mail zetten.
 */
export function getSiteUrl(fallbackOrigin: string): string {
  const configured = process.env.SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      throw new Error('SITE_URL is geen geldige URL.');
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SITE_URL ontbreekt in de omgevingsvariabelen.');
  }

  return fallbackOrigin;
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} ontbreekt in de omgevingsvariabelen.`);
  return value;
}