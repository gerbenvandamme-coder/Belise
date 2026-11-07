// Vervang deze voorlopige waarden door de echte salongegevens.
export const SALON = {
  name: 'BELISE',
  address: {
    street: 'Nanovestraat 71',
    postalCity: '1745 Opwijk',
  },
  hours: [
    { day: 'Maandag', time: 'Gesloten' },
    { day: 'Dinsdag', time: '10:00 – 19:00' },
    { day: 'Woensdag', time: '10:00 – 19:00' },
    { day: 'Donderdag', time: '10:00 – 19:00' },
    { day: 'Vrijdag', time: '10:00 – 19:00' },
    { day: 'Zaterdag', time: '10:00 – 17:00' },
    { day: 'Zondag', time: 'Gesloten' },
  ],
  instagram: {
    handle: '_belise._',
    url: 'https://www.instagram.com/_belise._/',
  },
  // Algemene parkeerinfo. Pas deze tekst aan zodra de echte parkeersituatie bekend is.
  parking:
    'Parkeer in de Nanovestraat of in de omliggende straten. Let op de plaatselijke parkeerborden. Kom je met de wagen, plan dan een paar minuten extra in om een plek te vinden.',
} as const;