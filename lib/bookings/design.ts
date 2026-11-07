import type { NailDesign } from './types';

// Typed als Record, zodat de compiler faalt als NailControls een optie toevoegt of verwijdert.
const SHAPE_LABELS: Record<NailDesign['shape'], string> = {
  square: 'Square',
  squoval: 'Squoval',
  round: 'Rond',
  oval: 'Ovaal',
  almond: 'Amandel',
  coffin: 'Coffin',
};

const LENGTH_LABELS: Record<NailDesign['length'], string> = {
  short: 'Kort',
  medium: 'Medium',
  long: 'Lang',
};

const FINISH_LABELS: Record<NailDesign['finish'], string> = {
  glossy: 'Hoogglans Gellak',
  matte: 'Velvet Mat',
  chrome: 'Glazed Chroom',
};

const PATTERN_LABELS: Record<NailDesign['pattern'], string> = {
  solid: 'Effen',
  french: 'Klassieke French',
  'micro-french': 'Micro French',
  ombre: 'Ombre / Babyboomer',
  dots: 'Polka Dots',
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasKey<T extends object>(source: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(source, key);
}

export type ParsedDesign = { ok: true; design: NailDesign | null } | { ok: false };

/** Valideert het optionele ontwerp uit de request. Alleen bekende waarden komen door. */
export function parseDesign(value: unknown): ParsedDesign {
  if (value === undefined || value === null) return { ok: true, design: null };
  if (!isRecord(value)) return { ok: false };

  const { shape, length, baseColor, finish, pattern, accentColor, accentRingOnly } = value;

  if (
    !hasKey(SHAPE_LABELS, shape) ||
    !hasKey(LENGTH_LABELS, length) ||
    !hasKey(FINISH_LABELS, finish) ||
    !hasKey(PATTERN_LABELS, pattern) ||
    typeof baseColor !== 'string' ||
    !HEX_COLOR.test(baseColor) ||
    typeof accentColor !== 'string' ||
    !HEX_COLOR.test(accentColor) ||
    typeof accentRingOnly !== 'boolean'
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    design: { shape, length, baseColor, finish, pattern, accentColor, accentRingOnly },
  };
}

/** Leesbare regels voor de e-mail aan de eigenares. */
export function describeDesign(design: NailDesign): [label: string, value: string][] {
  const usesAccent = design.pattern !== 'solid' || design.accentRingOnly;

  return [
    ['Vorm', SHAPE_LABELS[design.shape]],
    ['Lengte', LENGTH_LABELS[design.length]],
    ['Basiskleur', design.baseColor.toUpperCase()],
    ...(usesAccent ? [['Accentkleur', design.accentColor.toUpperCase()] as [string, string]] : []),
    ['Finish', FINISH_LABELS[design.finish]],
    ['Nail art', PATTERN_LABELS[design.pattern]],
    ['Accentnagel', design.accentRingOnly ? 'Ja, alleen de ringvinger' : 'Nee'],
  ];
}