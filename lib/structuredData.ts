import { CONTACT, SALON, isFilledIn } from '@/lib/salon';
import {
  getDurationRange,
  getPriceRange,
  type TreatmentCategory,
} from '@/lib/treatments';
import {
  BUSINESS_ID,
  CONTENT_PUBLISHED,
  CONTENT_UPDATED,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
  absoluteUrl,
} from '@/lib/site';

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SALON.address.street}, ${SALON.address.postalCity}, België`,
)}`;

const [postalCode, ...cityParts] = SALON.address.postalCity.split(' ');

export const POSTAL_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: SALON.address.street,
  postalCode,
  addressLocality: cityParts.join(' '),
  addressRegion: 'Vlaams-Brabant',
  addressCountry: 'BE',
};

/** De salon als lokale onderneming. Komt op elke pagina (via de layout). */
export function businessSchema() {
  const data: Record<string, unknown> = {
    '@type': ['BeautySalon', 'NailSalon', 'HairSalon'],
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    alternateName: ['Belise', 'BELISE'],
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: absoluteUrl('/brand/belise-logo-full.png'),
    image: [absoluteUrl('/assets/Front/Clean%20front%20picture.jpg'), absoluteUrl('/assets/treatments/Nails.jpg')],
    address: POSTAL_ADDRESS,
    hasMap: MAPS_URL,
    areaServed: ['Opwijk', 'Merchtem', 'Asse', 'Aalst', 'Dendermonde', 'Londerzeel', 'Vlaams-Brabant'].map(
      (name) => ({ '@type': 'Place', name }),
    ),
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    knowsLanguage: ['nl'],
    sameAs: [SALON.instagram.url],
    potentialAction: {
      '@type': 'ReserveAction',
      target: { '@type': 'EntryPoint', urlTemplate: absoluteUrl('/booking'), inLanguage: 'nl-BE' },
      result: { '@type': 'Reservation', name: 'Afspraak bij Belise' },
    },
    publicAccess: false,
    slogan: 'Enkel op afspraak',
  };
  if (isFilledIn(CONTACT.phoneInternational)) data.telephone = `+${CONTACT.phoneInternational}`;
  if (isFilledIn(CONTACT.email)) data.email = CONTACT.email;
  return data;
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'nl-BE',
    publisher: { '@id': BUSINESS_ID },
    datePublished: CONTENT_PUBLISHED,
    dateModified: CONTENT_UPDATED,
  };
}

/** Pagina met auteur, uitgever en datums, plus kruimelpad. */
export function pageSchema({
  path,
  name,
  description,
  type = 'WebPage',
  extra = {},
}: {
  path: string;
  name: string;
  description: string;
  type?: string;
  extra?: Record<string, unknown>;
}) {
  const url = absoluteUrl(path);
  const crumbs = [{ name: 'Home', path: '/' }, ...(path === '/' ? [] : [{ name, path }])];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type,
        '@id': `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: 'nl-BE',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BUSINESS_ID },
        author: { '@id': BUSINESS_ID },
        publisher: { '@id': BUSINESS_ID },
        datePublished: CONTENT_PUBLISHED,
        dateModified: CONTENT_UPDATED,
        breadcrumb: { '@id': `${url}#breadcrumb` },
        ...extra,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: absoluteUrl(crumb.path),
        })),
      },
    ],
  };
}

/** Volledige prijslijst als OfferCatalog, met prijs en duur per behandeling. */
export function offerCatalogSchema(categories: readonly TreatmentCategory[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    '@id': absoluteUrl('/behandelingen#catalog'),
    name: 'Behandelingen en tarieven Belise',
    provider: { '@id': BUSINESS_ID },
    itemListElement: categories.map((category) => ({
      '@type': 'OfferCatalog',
      name: category.title,
      description: category.subtitle,
      itemListElement: category.treatments.map((item) => {
        const price = getPriceRange(item);
        const duration = getDurationRange(item);
        return {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: item.title,
            category: [category.title, item.group].filter(Boolean).join(' – '),
            provider: { '@id': BUSINESS_ID },
            areaServed: 'Opwijk',
            ...(duration.min === duration.max ? { timeRequired: `PT${duration.min}M` } : {}),
          },
          priceCurrency: 'EUR',
          ...(price.min === price.max
            ? { price: price.min }
            : {
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  priceCurrency: 'EUR',
                  minPrice: price.min,
                  maxPrice: price.max,
                },
              }),
          url: absoluteUrl('/booking'),
        };
      }),
    })),
  };
}

/** FAQPage-schema voor de veelgestelde vragen. */
export function faqSchema(items: readonly { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
