// Contactgegevens. Zolang een waarde begint met '[', toont de site ze als 'nog in te vullen'.
export const CONTACT = {
  /** Zoals getoond op de site, bv. '0470 12 34 56'. */
  phone: '[IN TE VULLEN: telefoonnummer]',
  /** Internationaal, enkel cijfers, zonder + of 0 vooraan, bv. '32470123456'. Voor WhatsApp en tel:. */
  phoneInternational: '[IN TE VULLEN: bv. 32470123456]',
  email: '[IN TE VULLEN: e-mailadres]',
} as const;

export function isFilledIn(value: string): boolean {
  return !value.startsWith('[');
}

// Vervang deze voorlopige waarden door de echte salongegevens.
export const SALON = {
  name: 'BELISE',
  address: {
    street: 'Nanovestraat 71',
    postalCity: '1745 Opwijk',
  },
  instagram: {
    handle: '_belise._',
    url: 'https://www.instagram.com/_belise._/',
  },
  // Algemene parkeerinfo. Pas deze tekst aan zodra de echte parkeersituatie bekend is.
  parking:
    'Parkeer in de Nanovestraat of in de omliggende straten. Let op de plaatselijke parkeerborden. Kom je met de wagen, plan dan een paar minuten extra in om een plek te vinden.',
  // Gegevens voor de algemene voorwaarden en de privacyverklaring.
  // Zolang een waarde begint met '[', toont de site ze als gemarkeerde placeholder.
  legal: {
    ownerName: '[IN TE VULLEN: volledige naam zaakvoerder]',
    legalForm: '[IN TE VULLEN: eenmanszaak / vennootschapsvorm]',
    enterpriseNumber: '[IN TE VULLEN: ondernemingsnummer (KBO)]',
    vatStatus: '[IN TE VULLEN: btw-nummer, of vrijgesteld (kleine onderneming, art. 56bis WBTW)]',
    email: CONTACT.email,
    phone: CONTACT.phone,
    lastUpdated: '15 november 2026',
  },
} as const;

// Pagina "Over". Waarden die met '[' beginnen worden op de site verborgen tot ze zijn ingevuld.
export const ABOUT = {
  /** Voornaam of volledige naam van de zaakvoerder, bv. 'Belise'. */
  ownerName: '[IN TE VULLEN: naam zaakvoerder]',
  /** Eigen verhaal in alinea's. Leeg laten tot de bazin het aanlevert. */
  story: [] as readonly string[],
  /** Foto's van de zaak: { src: '/assets/salon/foto-1.jpg', alt: 'Beschrijving' }. */
  photos: [] as readonly { src: string; alt: string }[],
};
