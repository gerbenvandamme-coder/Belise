import { SALON } from '@/lib/salon';

/** Publieke basis-URL. Bij een eigen domein: NEXT_PUBLIC_SITE_URL instellen in Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://belise.vercel.app').replace(/\/$/, '');

/** Laatste inhoudelijke update van de site (ISO). Aanpassen bij grote tekstwijzigingen. */
export const CONTENT_UPDATED = '2026-11-15';
export const CONTENT_PUBLISHED = '2026-11-12';

export const SITE_NAME = 'Belise Beauty';
export const SITE_DESCRIPTION =
  'Belise is een beautysalon in Opwijk (Vlaams-Brabant) voor gelnagels, manicure, ontharing en haarverzorging. Enkel op afspraak, online te boeken.';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const BUSINESS_ID = `${SITE_URL}/#salon`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// De nageldesigner (/designer) staat uit; zie lib/features.ts.
export const PUBLIC_PAGES: readonly { path: string; name: string; description: string; priority: number }[] = [
  { path: '/', name: 'Home', description: SITE_DESCRIPTION, priority: 1 },
  { path: '/behandelingen', name: 'Behandelingen en tarieven', description: 'Alle behandelingen met prijs en duur: nagels, ontharing en haarverzorging.', priority: 0.9 },
  { path: '/booking', name: 'Afspraak maken', description: 'Online een afspraak boeken op een vrijgegeven moment.', priority: 0.9 },
  { path: '/portfolio', name: 'Portfolio', description: 'Recent werk per behandeling, te filteren op stijl.', priority: 0.7 },
  { path: '/over', name: 'Over Belise', description: 'Over de salon en de werkwijze.', priority: 0.6 },
  { path: '/contact', name: 'Contact en route', description: `Adres ${SALON.address.street}, ${SALON.address.postalCity}; bellen, WhatsApp, mail of een bericht via je account.`, priority: 0.7 },
  { path: '/algemene-voorwaarden', name: 'Algemene voorwaarden', description: 'Voorwaarden voor afspraken.', priority: 0.2 },
  { path: '/privacy', name: 'Privacyverklaring', description: 'Hoe Belise met persoonsgegevens omgaat.', priority: 0.2 },
];
