export type TreatmentCategoryId =
  | 'nails'
  | 'brows-lashes'
  | 'hair-styling'
  | 'makeup-packages';

export type TreatmentItem = {
  /** Stabiele sleutel, gebruikt in de boekingsflow. De ids biab, gellak en nail-art bestaan al in de boekingspagina. */
  id: string;
  title: string;
  /** Korte omschrijving van één regel, voor op de kaart. */
  description: string;
  /** Prijs in hele euro's. Gebruik formatPrice() om te tonen. */
  priceEuro: number;
  durationMinutes: number;
};

export type TreatmentCategory = {
  id: TreatmentCategoryId;
  title: string;
  subtitle: string;
  /** URL-pad vanuit public/. De bestanden staan in public/assets/treatments/. */
  image: string;
  treatments: readonly TreatmentItem[];
};

export const TREATMENT_CATEGORIES: readonly TreatmentCategory[] = [
  {
    id: 'nails',
    title: 'Nails',
    subtitle: 'Verzorgde nagels en professionele styling',
    image: '/assets/treatments/Nails.jpg',
    treatments: [
      {
        id: 'biab',
        title: 'BIAB Treatment',
        description: 'Versterkende laag op de natuurlijke nagel',
        priceEuro: 55,
        durationMinutes: 60,
      },
      {
        id: 'natural-nail',
        title: 'Natural Nail Treatment',
        description: 'Verzorging en versteviging van je eigen nagel',
        priceEuro: 45,
        durationMinutes: 45,
      },
      {
        id: 'gellak',
        title: 'Gellak & Manicure',
        description: 'Duurzame kleur met hoogglans afwerking',
        priceEuro: 40,
        durationMinutes: 45,
      },
      {
        id: 'nail-art',
        title: 'Custom Nail Art & Extensions',
        description: 'Verlenging met handgetekende designs',
        priceEuro: 75,
        durationMinutes: 90,
      },
    ],
  },
  {
    id: 'brows-lashes',
    title: 'Brows & Lashes',
    subtitle: 'Sprekende blik met perfecte wenkbrauwen en wimpers',
    image: '/assets/treatments/Brows_and_lashes.jpg',
    treatments: [
      {
        id: 'lash-lift-tint',
        title: 'Lash Lift & Tint',
        description: 'Krul en kleur voor een open, natuurlijk blik',
        priceEuro: 60,
        durationMinutes: 60,
      },
      {
        id: 'brow-lamination',
        title: 'Brow Lamination',
        description: 'Wenkbrauwen in model gezet en gelamineerd',
        priceEuro: 50,
        durationMinutes: 45,
      },
      {
        id: 'brow-styling-tinting',
        title: 'Brow Styling & Tinting',
        description: 'Vorm en kleur voor een verzorgd wenkbrauwbeeld',
        priceEuro: 30,
        durationMinutes: 30,
      },
    ],
  },
  {
    id: 'hair-styling',
    title: 'Hair & Styling',
    subtitle: 'Prachtig vallend haar en professionele styling',
    image: '/assets/treatments/Hair_and_styling.jpg',
    treatments: [
      {
        id: 'blowdry-glam',
        title: 'Blowdry & Glam Styling',
        description: 'Volume en glans voor een verzorgde look',
        priceEuro: 45,
        durationMinutes: 45,
      },
      {
        id: 'event-festival-updo',
        title: 'Event & Festival Updo',
        description: 'Opgestoken kapsel voor jouw speciale moment',
        priceEuro: 65,
        durationMinutes: 60,
      },
      {
        id: 'hair-botox-keratine',
        title: 'Hair Botox / Keratine',
        description: 'Diepe verzorging voor glad, glanzend haar',
        priceEuro: 110,
        durationMinutes: 120,
      },
    ],
  },
  {
    id: 'makeup-packages',
    title: 'Makeup & Packages',
    subtitle: 'Professionele visagie en luxe combinatiepakketten',
    image: '/assets/treatments/Makeup_packages.jpg',
    treatments: [
      {
        id: 'makeup-day-soft-glam',
        title: 'Day / Soft Glam Makeup',
        description: 'Frisse, lichte make-up voor overdag',
        priceEuro: 45,
        durationMinutes: 45,
      },
      {
        id: 'makeup-evening-full-glam',
        title: 'Evening / Full Glam Makeup',
        description: 'Uitgesproken make-up voor de avond',
        priceEuro: 65,
        durationMinutes: 60,
      },
      {
        id: 'makeup-bridal',
        title: 'Bridal Makeup',
        description: 'Duurzame make-up voor je trouwdag',
        priceEuro: 125,
        durationMinutes: 75,
      },
    ],
  },
];

/** Geeft een prijs weer zoals de rest van de site, bijvoorbeeld "€55". */
export function formatPrice(priceEuro: number): string {
  return `€${priceEuro}`;
}