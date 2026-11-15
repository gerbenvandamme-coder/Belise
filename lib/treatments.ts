export type TreatmentCategoryId = 'nails' | 'waxing' | 'hair' | 'massage';

export const LENGTH_OPTIONS = ['short', 'medium', 'long'] as const;
export type LengthOption = (typeof LENGTH_OPTIONS)[number];

export const LENGTH_LABELS: Record<LengthOption, string> = {
  short: 'Kort',
  medium: 'Midden',
  long: 'Lang',
};

export type PerLength<T> = Readonly<Record<LengthOption, T>>;

/** Een vaste waarde, of een waarde per lengte (Kort / Midden / Lang). */
export type LengthValue<T> = T | PerLength<T>;

export type TreatmentItem = {
  /** Stabiele sleutel, gebruikt in de boekingsflow. */
  id: string;
  title: string;
  /** Subkop binnen een categorie, bijvoorbeeld "Gelnagels" of "Snit & Kleuring". */
  group?: string;
  /** Prijs in hele euro's, vast of per lengte. Gebruik formatPrice() of formatPriceRange() om te tonen. */
  priceEuro: LengthValue<number>;
  /** Actieve werktijd in minuten. */
  activeDurationMin: LengthValue<number>;
  /** Inwerktijd in minuten, zonder actief werk. Standaard 0. */
  processingDurationMin?: LengthValue<number>;
};

export type TreatmentCategory = {
  id: TreatmentCategoryId;
  title: string;
  subtitle: string;
  /** URL-pad vanuit public/. De bestanden staan in public/assets/treatments/. Null: geen foto (nog). */
  image: string | null;
  treatments: readonly TreatmentItem[];
};

export const TREATMENT_CATEGORIES: readonly TreatmentCategory[] = [
  {
    id: 'nails',
    title: 'Nagels',
    subtitle: 'Verzorgde nagels en professionele styling',
    image: '/assets/treatments/Nails.jpg',
    treatments: [
      {
        id: 'gelnagels-nieuwe-set',
        group: 'Gelnagels',
        title: 'Gelnagels nieuwe set',
        priceEuro: 55,
        activeDurationMin: 90,
      },
      {
        id: 'gelnagels-nieuwe-set-verlenging',
        group: 'Gelnagels',
        title: 'Gelnagels nieuwe set + verlenging',
        priceEuro: 60,
        activeDurationMin: 120,
      },
      {
        id: 'gelnagels-bijwerking-4-weken',
        group: 'Gelnagels',
        title: 'Gelnagels bijwerking (4 weken)',
        priceEuro: 45,
        activeDurationMin: 60,
      },
      {
        id: 'gelnagels-bijwerking-plus-4-weken',
        group: 'Gelnagels',
        title: 'Gelnagels bijwerking (+4 weken)',
        priceEuro: 55,
        activeDurationMin: 75,
      },
      {
        id: 'biab-nieuwe-set',
        group: 'BIAB',
        title: 'BIAB nieuwe set',
        priceEuro: 50,
        activeDurationMin: 90,
      },
      {
        id: 'biab-bijwerking-3-weken',
        group: 'BIAB',
        title: 'BIAB bijwerking (3 weken)',
        priceEuro: 40,
        activeDurationMin: 60,
      },
      {
        id: 'biab-bijwerking-plus-3-weken',
        group: 'BIAB',
        title: 'BIAB bijwerking (+3 weken)',
        priceEuro: 45,
        activeDurationMin: 75,
      },
      {
        id: 'biab-kleur-3-weken',
        group: 'BIAB',
        title: 'BIAB + kleur (3 weken)',
        priceEuro: 45,
        activeDurationMin: 75,
      },
      {
        id: 'biab-kleur-plus-3-weken',
        group: 'BIAB',
        title: 'BIAB + kleur (+3 weken)',
        priceEuro: 50,
        activeDurationMin: 90,
      },
      {
        id: 'biab-op-tenen',
        group: 'BIAB',
        title: 'BIAB op tenen',
        priceEuro: 35,
        activeDurationMin: 60,
      },
      {
        id: 'manicure',
        group: 'Manicure & Verwijderen',
        title: 'Manicure',
        priceEuro: 20,
        activeDurationMin: 30,
      },
      {
        id: 'manicure-lakken',
        group: 'Manicure & Verwijderen',
        title: 'Manicure + lakken',
        priceEuro: 25,
        activeDurationMin: 40,
      },
      {
        id: 'verwijderen-gelnagels-biab-manicure',
        group: 'Manicure & Verwijderen',
        title: 'Gelnagels/BIAB verwijderen + manicure',
        priceEuro: 25,
        activeDurationMin: 30,
        processingDurationMin: 15,
      },
    ],
  },
  {
    id: 'waxing',
    title: 'Ontharing',
    subtitle: 'Gladde huid met een zorgvuldige behandeling',
    image: '/assets/treatments/Brows_and_lashes.jpg',
    treatments: [
      { id: 'bovenlip', title: 'Bovenlip', priceEuro: 6, activeDurationMin: 10 },
      { id: 'wenkbrauwen', title: 'Wenkbrauwen', priceEuro: 8, activeDurationMin: 10 },
      { id: 'oksels', title: 'Oksels', priceEuro: 14, activeDurationMin: 15 },
      { id: 'bikinilijn', title: 'Bikinilijn', priceEuro: 20, activeDurationMin: 20 },
      { id: 'benen-volledig', title: 'Benen volledig', priceEuro: 40, activeDurationMin: 45 },
      { id: 'onderbenen', title: 'Onderbenen', priceEuro: 22, activeDurationMin: 25 },
      { id: 'bovenbenen', title: 'Bovenbenen', priceEuro: 20, activeDurationMin: 25 },
    ],
  },
  {
    id: 'hair',
    title: 'Haarverzorging',
    subtitle: 'Prachtig vallend haar en professionele styling',
    image: '/assets/treatments/Hair_and_styling.jpg',
    treatments: [
      {
        id: 'snit',
        group: 'Snit & Kleuring',
        title: 'Snit',
        priceEuro: 20,
        activeDurationMin: 30,
      },
      {
        id: 'snit-brushing',
        group: 'Snit & Kleuring',
        title: 'Snit + Brushing',
        priceEuro: 40,
        activeDurationMin: 60,
      },
      {
        id: 'kleur-snit',
        group: 'Snit & Kleuring',
        title: 'Kleur + snit',
        priceEuro: 55,
        activeDurationMin: 45,
        processingDurationMin: 35,
      },
      {
        id: 'kleur-brushing',
        group: 'Snit & Kleuring',
        title: 'Kleur + brushing',
        priceEuro: 65,
        activeDurationMin: 60,
        processingDurationMin: 35,
      },
      {
        id: 'kleur-snit-brushing',
        group: 'Snit & Kleuring',
        title: 'Kleur + snit + brushing',
        priceEuro: 75,
        activeDurationMin: 90,
        processingDurationMin: 35,
      },
      {
        id: 'mesches-volledig',
        group: 'Technieken & Brushing',
        title: 'Mèches volledig',
        priceEuro: { short: 70, medium: 80, long: 90 },
        activeDurationMin: { short: 120, medium: 150, long: 180 },
        processingDurationMin: 30,
      },
      {
        id: 'mesches-deels',
        group: 'Technieken & Brushing',
        title: 'Mèches deels',
        priceEuro: { short: 40, medium: 50, long: 60 },
        activeDurationMin: { short: 90, medium: 105, long: 120 },
        processingDurationMin: 30,
      },
      {
        id: 'balayage-volledig',
        group: 'Technieken & Brushing',
        title: 'Balayage volledig',
        priceEuro: { short: 60, medium: 70, long: 80 },
        activeDurationMin: { short: 120, medium: 135, long: 150 },
        processingDurationMin: 30,
      },
      {
        id: 'balayage-deels',
        group: 'Technieken & Brushing',
        title: 'Balayage deels',
        priceEuro: { short: 30, medium: 40, long: 50 },
        activeDurationMin: { short: 75, medium: 90, long: 105 },
        processingDurationMin: 30,
      },
      {
        id: 'brushing',
        group: 'Technieken & Brushing',
        title: 'Brushing',
        priceEuro: { short: 30, medium: 35, long: 40 },
        activeDurationMin: { short: 30, medium: 35, long: 45 },
      },
    ],
  },
  {
    // Nieuw aanbod. De eigenares voegt de massages en prijzen toe in /admin (Tarieven & site).
    // Zolang er geen actieve massage is, wordt deze categorie nergens getoond.
    id: 'massage',
    title: 'Massage',
    subtitle: 'Even helemaal tot rust komen',
    image: null,
    treatments: [],
  },
];

/** Enkel categorieën met minstens één behandeling worden getoond op de site en in de boeker. */
export function visibleCategories(
  categories: readonly TreatmentCategory[],
): readonly TreatmentCategory[] {
  return categories.filter((category) => category.treatments.length > 0);
}

function pickLengthValue(value: LengthValue<number>, length: LengthOption | null): number {
  if (typeof value === 'number') return value;
  return value[length ?? 'short'];
}

function getRange(value: LengthValue<number>): { min: number; max: number } {
  if (typeof value === 'number') return { min: value, max: value };
  const all = LENGTH_OPTIONS.map((option) => value[option]);
  return { min: Math.min(...all), max: Math.max(...all) };
}

export function hasLengthOptions(item: TreatmentItem): boolean {
  return typeof item.priceEuro !== 'number';
}

/** Zonder lengtekeuze geeft een lengte-afhankelijk item de kortste variant. */
export function getPriceEuro(item: TreatmentItem, length: LengthOption | null = null): number {
  return pickLengthValue(item.priceEuro, length);
}

export function getActiveDurationMin(
  item: TreatmentItem,
  length: LengthOption | null = null,
): number {
  return pickLengthValue(item.activeDurationMin, length);
}

export function getProcessingDurationMin(
  item: TreatmentItem,
  length: LengthOption | null = null,
): number {
  if (item.processingDurationMin === undefined) return 0;
  return pickLengthValue(item.processingDurationMin, length);
}

export function getTotalDurationMin(item: TreatmentItem, length: LengthOption | null = null): number {
  return getActiveDurationMin(item, length) + getProcessingDurationMin(item, length);
}

export function getPriceRange(item: TreatmentItem): { min: number; max: number } {
  return getRange(item.priceEuro);
}

export function getDurationRange(item: TreatmentItem): { min: number; max: number } {
  const active = getRange(item.activeDurationMin);
  const processing = getRange(item.processingDurationMin ?? 0);
  return { min: active.min + processing.min, max: active.max + processing.max };
}

/** Geeft een prijs weer zoals de rest van de site, bijvoorbeeld "€55". */
export function formatPrice(priceEuro: number): string {
  return `€${priceEuro}`;
}

/** Toont een bereik zoals "€70 - €90", of één prijs als min en max gelijk zijn. */
export function formatPriceRange(min: number, max: number): string {
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

/** Toont een duurbereik zoals "60-120 min", of één duur als min en max gelijk zijn. */
export function formatDurationRange(min: number, max: number): string {
  return min === max ? `${min} min` : `${min}-${max} min`;
}