// Contactgegevens. Zolang een waarde begint met '[', toont de site ze als 'nog in te vullen'.
export const CONTACT = {
  /** Zoals getoond op de site, bv. '0470 12 34 56'. */
  phone: '0488 33 46 95',
  /** Internationaal, enkel cijfers, zonder + of 0 vooraan, bv. '32470123456'. Voor WhatsApp en tel:. */
  phoneInternational: '32488334695',
  email: 'lisevrijders@outlook.com',
} as const;

export function isFilledIn(value: string): boolean {
  return !value.startsWith('[');
}

// Vervang deze voorlopige waarden door de echte salongegevens.
export const SALON = {
  name: 'BELISE',
  address: {
    street: 'Nanovestraat 71 A',
    postalCity: '1745 Opwijk',
  },
  instagram: {
    handle: '_belise._',
    url: 'https://www.instagram.com/_belise._/',
  },
  parking:
    'Je parkeert vlak bij de salon: aan de overkant van de straat langs de zijkant, in de Oude Pastoriedreef of langs de weg in de Millenniumstraat.',
  /** Betaalmiddelen ter plaatse. */
  payment: 'Je betaalt ter plaatse na je behandeling, met Payconiq of cash. Een voorschot is niet nodig.',
  /**
   * Momenten waarop de zaakvoerder in behandeling is en niet meteen antwoordt.
   * Wordt discreet getoond op /contact; de toon blijft uitnodigend.
   */
  busyHours: [
    { day: 'Woensdag', hours: '9u – 20u' },
    { day: 'Donderdag', hours: '9u – 19u' },
    { day: 'Vrijdag', hours: '7u – 19u' },
    { day: 'Zaterdag', hours: '7u – 15u' },
  ] as readonly { day: string; hours: string }[],
  // Gegevens voor de algemene voorwaarden en de privacyverklaring.
  // Zolang een waarde begint met '[', toont de site ze als gemarkeerde placeholder.
  legal: {
    ownerName: 'Lise Vrijders',
    legalForm: 'eenmanszaak',
    enterpriseNumber: '1002.326.338',
    vatStatus: 'BE 1002.326.338, vrijgesteld van btw (bijzondere vrijstellingsregeling kleine ondernemingen, art. 56bis WBTW)',
    email: CONTACT.email,
    phone: CONTACT.phone,
    lastUpdated: '26 november 2026',
  },
} as const;

// Pagina "Over". Waarden die met '[' beginnen worden op de site verborgen tot ze zijn ingevuld.
export const ABOUT = {
  /** Voornaam of volledige naam van de zaakvoerder, bv. 'Belise'. */
  ownerName: 'Lise',
  /** Eigen verhaal in alinea's. Leeg laten tot de bazin het aanlevert. */
  story: [] as readonly string[],
  /** Foto's van de zaak: { src: '/assets/salon/foto-1.jpg', alt: 'Beschrijving' }. */
  photos: [] as readonly { src: string; alt: string }[],
};
