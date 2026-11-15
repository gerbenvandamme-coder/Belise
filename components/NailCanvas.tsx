'use client';

import { useId } from 'react';

export type NailFinish = 'glossy' | 'matte' | 'chrome';
export type NailPattern = 'solid' | 'french' | 'micro-french' | 'ombre' | 'dots';

export const HAND_OPTIONS = [
  { id: 'licht', label: 'Licht', swatch: '#efbfab' },
  { id: 'warm', label: 'Warm', swatch: '#d8926f' },
  { id: 'goud', label: 'Goudbruin', swatch: '#c08962' },
  { id: 'donker', label: 'Donker', swatch: '#7c493b' },
] as const;

export type HandId = (typeof HAND_OPTIONS)[number]['id'];

export type NailCanvasProps = {
  shape: string;
  length: string;
  baseColor: string;
  finish: NailFinish;
  pattern: NailPattern;
  accentColor: string;
  /** Patroon (of bij 'solid' de accentkleur) alleen op de ringvinger. */
  accentRingOnly: boolean;
  hand?: HandId;
  className?: string;
};

type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
/** Nagelbed per vinger, opgemeten op de foto (1200 x 896 px): nagelriem x/y, hoek, breedte, lengte. */
type NailBed = { cx: number; cy: number; angle: number; width: number; bed: number };

const NAIL_BEDS: Record<HandId, Record<FingerId, NailBed>> = {
  licht: {
    index: { cx: 498.5, cy: 163, angle: -3, width: 34, bed: 39 },
    middle: { cx: 620, cy: 130, angle: 0, width: 37, bed: 45 },
    ring: { cx: 732, cy: 177, angle: 8, width: 34, bed: 42 },
    pinky: { cx: 831, cy: 297, angle: 18, width: 27, bed: 40 },
    thumb: { cx: 352, cy: 413, angle: -53, width: 37, bed: 48 },
  },
  goud: {
    index: { cx: 486, cy: 173, angle: -2, width: 33, bed: 41 },
    middle: { cx: 611, cy: 131, angle: 0, width: 38, bed: 48 },
    ring: { cx: 721, cy: 182, angle: 5, width: 35, bed: 44 },
    pinky: { cx: 830, cy: 304, angle: 16, width: 27, bed: 40 },
    thumb: { cx: 333, cy: 435, angle: -57, width: 37, bed: 48 },
  },
  warm: {
    index: { cx: 492.5, cy: 172, angle: -2, width: 34, bed: 40 },
    middle: { cx: 610, cy: 136, angle: 0, width: 38, bed: 47 },
    ring: { cx: 731, cy: 186, angle: 6, width: 35, bed: 45 },
    pinky: { cx: 836, cy: 305, angle: 15, width: 27, bed: 40 },
    thumb: { cx: 343, cy: 424, angle: -55, width: 37, bed: 48 },
  },
  donker: {
    index: { cx: 487.5, cy: 175, angle: -2, width: 34, bed: 40 },
    middle: { cx: 607.5, cy: 132, angle: 0, width: 38, bed: 46 },
    ring: { cx: 722.5, cy: 184, angle: 4, width: 35, bed: 46 },
    pinky: { cx: 830, cy: 304, angle: 12, width: 26, bed: 40 },
    thumb: { cx: 332, cy: 435, angle: -55, width: 37, bed: 48 },
  },
};

const FINGERS: readonly FingerId[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

/** Extra lengte voorbij de vingertop, als deel van de nagelbreedte. */
const EXTENSION: Record<string, number> = { short: 0.08, medium: 0.42, long: 0.85 };

const VIEW_BOX = '215 15 730 560';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function handSrc(hand: HandId): string {
  return `/assets/Hands/hand-${hand}.webp`;
}

/** Nagelvorm in lokale coördinaten: nagelriem op y = 0, vrije rand op y = -h. */
function nailPath(shape: string, hw: number, h: number): string {
  const cuticle = `L ${hw} 0 Q 0 ${hw * 0.42} ${-hw} 0 Z`;
  switch (shape) {
    case 'square': {
      const r = hw * 0.14;
      return `M ${-hw} 0 L ${-hw} ${-h + r} Q ${-hw} ${-h} ${-hw + r} ${-h} L ${hw - r} ${-h} Q ${hw} ${-h} ${hw} ${-h + r} ${cuticle}`;
    }
    case 'squoval': {
      const r = hw * 0.55;
      return `M ${-hw} 0 L ${-hw} ${-h + r} Q ${-hw} ${-h} ${-hw + r} ${-h} L ${hw - r} ${-h} Q ${hw} ${-h} ${hw} ${-h + r} ${cuticle}`;
    }
    case 'round': {
      const r = Math.min(hw, h);
      return `M ${-hw} 0 L ${-hw} ${-h + r} A ${hw} ${r} 0 0 1 ${hw} ${-h + r} ${cuticle}`;
    }
    case 'oval':
      return `M ${-hw} 0 L ${-hw} ${-h * 0.45} C ${-hw} ${-h * 0.92} ${-hw * 0.5} ${-h} 0 ${-h} C ${hw * 0.5} ${-h} ${hw} ${-h * 0.92} ${hw} ${-h * 0.45} ${cuticle}`;
    case 'almond':
      return `M ${-hw} 0 L ${-hw} ${-h * 0.32} C ${-hw} ${-h * 0.72} ${-hw * 0.32} ${-h * 0.96} 0 ${-h} C ${hw * 0.32} ${-h * 0.96} ${hw} ${-h * 0.72} ${hw} ${-h * 0.32} ${cuticle}`;
    case 'coffin': {
      const top = hw * 0.55;
      return `M ${-hw} 0 L ${-hw} ${-h * 0.4} L ${-top} ${-h + 1.5} Q ${-top + 1} ${-h} ${-top + 3} ${-h} L ${top - 3} ${-h} Q ${top - 1} ${-h} ${top} ${-h + 1.5} L ${hw} ${-h * 0.4} ${cuticle}`;
    }
    default:
      return `M ${-hw} 0 L ${-hw} ${-h * 0.45} C ${-hw} ${-h * 0.92} ${-hw * 0.5} ${-h} 0 ${-h} C ${hw * 0.5} ${-h} ${hw} ${-h * 0.92} ${hw} ${-h * 0.45} ${cuticle}`;
  }
}

/** French-rand met een lichte glimlachlijn. depth = diepte vanaf de vrije rand. */
function smilePath(hw: number, h: number, depth: number): string {
  const y = -h + depth;
  return `M ${-hw * 1.3} ${y - depth * 0.55} Q 0 ${y + depth * 0.5} ${hw * 1.3} ${y - depth * 0.55} L ${hw * 1.3} ${-h - 4} L ${-hw * 1.3} ${-h - 4} Z`;
}

function Nail({
  id,
  bed,
  shape,
  length,
  base,
  accent,
  finish,
  art,
}: {
  id: string;
  bed: NailBed;
  shape: string;
  length: string;
  base: string;
  accent: string;
  finish: NailFinish;
  art: NailPattern | 'accent-fill';
}) {
  const hw = bed.width / 2;
  const h = bed.bed + (EXTENSION[length] ?? EXTENSION.medium) * bed.width;
  const path = nailPath(shape, hw, h);
  const fill = art === 'accent-fill' ? accent : base;

  const dots: { x: number; y: number }[] = [];
  if (art === 'dots') {
    const r = bed.width * 0.075;
    for (let row = 0; row < 6; row++) {
      for (let col = -1; col <= 1; col++) {
        const y = -h + r * 2.2 + row * r * 3.6;
        if (y > -r * 1.5) continue;
        dots.push({ x: col * r * 3.6 + (row % 2 ? r * 1.8 : 0), y });
      }
    }
  }

  return (
    <g transform={`translate(${bed.cx} ${bed.cy}) rotate(${bed.angle})`} filter={`url(#${id}-lift)`}>
      <clipPath id={`${id}-clip`}>
        <path d={path} />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`} mask={`url(#${id}-soft)`}>
        {art === 'ombre' ? (
          <rect x={-hw - 2} y={-h - 2} width={bed.width + 4} height={h + hw} fill={`url(#${id}-ombre)`} />
        ) : (
          <rect x={-hw - 2} y={-h - 2} width={bed.width + 4} height={h + hw} fill={fill} />
        )}
        {art === 'french' && <path d={smilePath(hw, h, Math.max(h * 0.3, 8))} fill={accent} />}
        {art === 'micro-french' && <path d={smilePath(hw, h, Math.max(h * 0.1, 3))} fill={accent} />}
        {dots.map((dot) => (
          <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={bed.width * 0.075} fill={accent} />
        ))}

        {/* Ronding: donkerder aan de zijkanten en bij de vrije rand. */}
        <rect
          x={-hw - 2}
          y={-h - 2}
          width={bed.width + 4}
          height={h + hw}
          fill={`url(#${id}-curve)`}
          style={{ mixBlendMode: 'multiply' }}
        />

        {finish === 'glossy' && (
          <>
            <rect
              x={-hw * 0.52}
              y={-h * 0.88}
              width={hw * 0.3}
              height={h * 0.62}
              rx={hw * 0.15}
              fill="#fff"
              opacity={0.55}
              filter={`url(#${id}-blur)`}
            />
            <ellipse cx={hw * 0.3} cy={-h * 0.82} rx={hw * 0.14} ry={h * 0.06} fill="#fff" opacity={0.5} />
          </>
        )}
        {finish === 'matte' && (
          <rect x={-hw - 2} y={-h - 2} width={bed.width + 4} height={h + hw} fill="#fff" opacity={0.08} />
        )}
        {finish === 'chrome' && (
          <rect
            x={-hw - 2}
            y={-h - 2}
            width={bed.width + 4}
            height={h + hw}
            fill={`url(#${id}-chrome)`}
            style={{ mixBlendMode: 'screen' }}
          />
        )}
      </g>
      <path d={path} fill="none" stroke="rgba(40,20,15,0.18)" strokeWidth={0.6} />

      <defs>
        <linearGradient id={`${id}-ombre`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={-h}>
          <stop offset="0.15" stopColor={base} />
          <stop offset="0.95" stopColor={accent} />
        </linearGradient>
        <linearGradient id={`${id}-curve`} gradientUnits="userSpaceOnUse" x1={-hw} y1="0" x2={hw} y2="0">
          <stop offset="0" stopColor="#b9a8a2" />
          <stop offset="0.22" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b9a8a2" />
        </linearGradient>
        <linearGradient id={`${id}-chrome`} gradientUnits="userSpaceOnUse" x1={-hw} y1={-h} x2={hw} y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1={hw * 0.45} x2="0" y2={-hw * 0.2}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-soft`} maskUnits="userSpaceOnUse" x={-hw - 4} y={-h - 6} width={bed.width + 8} height={h + hw + 10}>
          <rect x={-hw - 4} y={-h - 6} width={bed.width + 8} height={h + hw + 10} fill={`url(#${id}-fade)`} />
        </mask>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={hw * 0.09} />
        </filter>
        <filter id={`${id}-lift`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.3" floodColor="#3a2219" floodOpacity="0.28" />
        </filter>
      </defs>
    </g>
  );
}

/**
 * Nageldesigner: een echte handfoto met nagels als SVG-lagen erover.
 * Werkt volledig in de browser, zonder maskerbestanden.
 */
export default function NailCanvas({
  shape,
  length,
  baseColor,
  finish,
  pattern,
  accentColor,
  accentRingOnly,
  hand = 'licht',
  className,
}: NailCanvasProps) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const base = HEX_COLOR.test(baseColor) ? baseColor : '#D8B9A0';
  const accent = HEX_COLOR.test(accentColor) ? accentColor : '#6B1E2E';
  const beds = NAIL_BEDS[hand];

  const artFor = (finger: FingerId): NailPattern | 'accent-fill' => {
    if (!accentRingOnly) return pattern;
    if (finger !== 'ring') return 'solid';
    return pattern === 'solid' ? 'accent-fill' : pattern;
  };

  return (
    <svg
      viewBox={VIEW_BOX}
      role="img"
      aria-label={`Nagelvoorbeeld: ${shape}, ${length}, ${finish}, patroon ${pattern}`}
      data-nail-preview=""
      className={`block h-auto w-full select-none rounded-2xl ${className ?? ''}`}
    >
      <image href={handSrc(hand)} x="0" y="0" width="1200" height="896" preserveAspectRatio="none" />
      {FINGERS.map((finger) => (
        <Nail
          key={finger}
          id={`n${uid}${finger}`}
          bed={beds[finger]}
          shape={shape}
          length={length}
          base={base}
          accent={accent}
          finish={finish}
          art={artFor(finger)}
        />
      ))}
    </svg>
  );
}

/** Zet het voorbeeld om naar een PNG (de foto wordt ingebed zodat de export volledig is). */
export async function exportNailPreview(svg: SVGSVGElement, hand: HandId): Promise<string> {
  const response = await fetch(handSrc(hand));
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Foto kon niet worden gelezen.'));
    reader.readAsDataURL(blob);
  });

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.querySelector('image')?.setAttribute('href', dataUrl);
  const [, , vw, vh] = (svg.getAttribute('viewBox') ?? '0 0 730 560').split(' ').map(Number);
  const scale = 2;
  clone.setAttribute('width', String(vw * scale));
  clone.setAttribute('height', String(vh * scale));

  const source = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Export mislukt.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = vw * scale;
    canvas.height = vh * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Export mislukt.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
