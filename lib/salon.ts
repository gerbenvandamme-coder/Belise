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
    email: '[IN TE VULLEN: e-mailadres salon]',
    phone: '[IN TE VULLEN: telefoonnummer salon]',
    lastUpdated: '15 november 2026',
  },
} as const;