'use client';

import { useId, useRef, useState } from 'react';
import { Download, Shuffle } from 'lucide-react';

type Point = { x: number; y: number };
type SkinTone = { label: string; hex: string };
type Option<T extends string> = { id: T; label: string };
type NailShape = 'square' | 'squoval' | 'round' | 'oval' | 'almond' | 'stiletto' | 'coffin';
type NailLength = 'short' | 'medium' | 'long';
type Finish = 'gloss' | 'matte' | 'chrome' | 'glitter';
type Pattern = 'solid' | 'french' | 'microFrench' | 'ombre' | 'polka';
type FingerId = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
type Finger = { id: FingerId; base: Point; tip: Point; width: number };

type Design = {
  skin: string;
  shape: NailShape;
  length: NailLength;
  color: string;
  accent: string;
  finish: Finish;
  pattern: Pattern;
  accentRingOnly: boolean;
};

type NailIds = { shade: string; ombre: string; chrome: string; noise: string };

const SKIN_TONES: readonly SkinTone[] = [
  { label: 'Porselein', hex: '#F5D6C6' },
  { label: 'Warm Beige', hex: '#E8B896' },
  { label: 'Olijf', hex: '#C68A5C' },
  { label: 'Karamel', hex: '#8D5524' },
  { label: 'Diep Espresso', hex: '#4A2C18' },
];

const SHAPES: readonly Option<NailShape>[] = [
  { id: 'square', label: 'Square' },
  { id: 'squoval', label: 'Squoval' },
  { id: 'round', label: 'Rond' },
  { id: 'oval', label: 'Ovaal' },
  { id: 'almond', label: 'Amandel' },
  { id: 'stiletto', label: 'Stiletto' },
  { id: 'coffin', label: 'Coffin' },
];

/** extension is the extra free-edge length as a fraction of finger width. The cuticle does not move. */
const LENGTHS: readonly (Option<NailLength> & { extension: number })[] = [
  { id: 'short', label: 'Kort', extension: 0 },
  { id: 'medium', label: 'Medium', extension: 0.14 },
  { id: 'long', label: 'Lang', extension: 0.3 },
];

const FINISHES: readonly Option<Finish>[] = [
  { id: 'gloss', label: 'Glanzend' },
  { id: 'matte', label: 'Mat' },
  { id: 'chrome', label: 'Chroom' },
  { id: 'glitter', label: 'Glitter' },
];

const PATTERNS: readonly Option<Pattern>[] = [
  { id: 'solid', label: 'Effen' },
  { id: 'french', label: 'Classic French' },
  { id: 'microFrench', label: 'Micro French' },
  { id: 'ombre', label: 'Ombre' },
  { id: 'polka', label: 'Polka Dots' },
];

const COLOR_PRESETS: readonly { label: string; hex: string }[] = [
  { label: 'Naakt', hex: '#E9C9B6' },
  { label: 'Zacht nude', hex: '#D9A49A' },
  { label: 'Roze', hex: '#E58FA6' },
  { label: 'Bordeaux', hex: '#6D1F2F' },
  { label: 'Melkwit', hex: '#F7F3EE' },
];

/** Draw order: back fingers first, thumb last. Coordinates are in the 400 x 560 viewBox. */
const FINGERS: readonly Finger[] = [
  { id: 'pinky', base: { x: 306, y: 360 }, tip: { x: 322, y: 225 }, width: 40 },
  { id: 'ring', base: { x: 256, y: 330 }, tip: { x: 262, y: 150 }, width: 48 },
  { id: 'middle', base: { x: 196, y: 320 }, tip: { x: 196, y: 130 }, width: 52 },
  { id: 'index', base: { x: 132, y: 330 }, tip: { x: 128, y: 165 }, width: 50 },
  { id: 'thumb', base: { x: 118, y: 430 }, tip: { x: 70, y: 300 }, width: 58 },
];

const PALM_PATH =
  'M92 330 Q104 292 170 290 L292 290 Q336 300 334 352 L322 470 Q318 530 300 548 L118 548 Q102 520 100 452 Z';

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 560;
const EXPORT_WIDTH = 800;
const EXPORT_HEIGHT = 1120;
const CANVAS_BG = '#FAF7F2';
const SVG_NS = 'http://www.w3.org/2000/svg';

const BLEND_MULTIPLY = { mixBlendMode: 'multiply' } as const;
const BLEND_SCREEN = { mixBlendMode: 'screen' } as const;

const DEFAULT_DESIGN: Design = {
  skin: '#E8B896',
  shape: 'almond',
  length: 'medium',
  color: '#E9C9B6',
  accent: '#6D1F2F',
  finish: 'gloss',
  pattern: 'solid',
  accentRingOnly: false,
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Mixes two hex colors. amount 0 returns from, amount 1 returns to. */
function mixHex(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const channels = a.map((channel, i) =>
    Math.round(channel + (b[i] - channel) * amount).toString(16).padStart(2, '0'),
  );
  return `#${channels.join('')}`;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Small deterministic PRNG, so the glitter pattern stays the same between renders. */
function seeded(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Builds the nail outline in local coordinates. The cuticle sits at y = 0 and the free edge at y = -h.
 * hw is the half width at the cuticle.
 */
function nailPath(shape: NailShape, hw: number, h: number): string {
  switch (shape) {
    case 'square':
      return boxPath(hw, h, hw * 0.12);
    case 'squoval':
      return boxPath(hw, h, hw * 0.7);
    case 'round':
      return `M${-hw} 0 L${-hw} ${-h * 0.4} C${-hw} ${-h * 1.2} ${hw} ${-h * 1.2} ${hw} ${-h * 0.4} L${hw} 0 Z`;
    case 'oval': {
      const w = hw * 0.88;
      return `M${-w} 0 L${-w} ${-h * 0.45} C${-w} ${-h * 1.2} ${w} ${-h * 1.2} ${w} ${-h * 0.45} L${w} 0 Z`;
    }
    case 'almond':
      return `M${-hw} 0 C${-hw} ${-h * 0.5} ${-hw * 0.35} ${-h * 0.92} 0 ${-h} C${hw * 0.35} ${-h * 0.92} ${hw} ${-h * 0.5} ${hw} 0 Z`;
    case 'stiletto':
      return `M${-hw} 0 L${-hw * 0.5} ${-h * 0.82} L0 ${-h} L${hw * 0.5} ${-h * 0.82} L${hw} 0 Z`;
    case 'coffin':
      return `M${-hw} 0 L${-hw * 0.78} ${-h * 0.82} L${-hw * 0.62} ${-h} L${hw * 0.62} ${-h} L${hw * 0.78} ${-h * 0.82} L${hw} 0 Z`;
  }
}

function boxPath(hw: number, h: number, radius: number): string {
  const r = Math.min(radius, hw, h * 0.5);
  return `M${-hw} 0 L${-hw} ${-h + r} Q${-hw} ${-h} ${-hw + r} ${-h} L${hw - r} ${-h} Q${hw} ${-h} ${hw} ${-h + r} L${hw} 0 Z`;
}

function polkaDots(hw: number, h: number): Point[] {
  const dots: Point[] = [];
  const step = hw * 0.55;
  let row = 0;
  for (let y = -step * 0.6; y > -h + step * 0.4; y -= step * 0.9) {
    const offset = row % 2 === 0 ? 0 : step * 0.5;
    for (let x = -hw + step * 0.5 + offset; x < hw - step * 0.3; x += step) {
      dots.push({ x, y });
    }
    row += 1;
  }
  return dots;
}

function sparkles(hw: number, h: number, seed: number) {
  const random = seeded(seed);
  return Array.from({ length: 14 }, () => ({
    x: (random() * 2 - 1) * hw * 0.8,
    y: -random() * h * 0.9,
    r: 0.6 + random() * 1.2,
  }));
}

/** Picks the nail color and pattern for one finger, based on the accent-nail toggle. */
function nailStyleFor(design: Design, finger: FingerId): { color: string; pattern: Pattern } {
  if (!design.accentRingOnly) return { color: design.color, pattern: design.pattern };
  if (finger !== 'ring') return { color: design.color, pattern: 'solid' };
  if (design.pattern === 'solid') return { color: design.accent, pattern: 'solid' };
  return { color: design.color, pattern: design.pattern };
}

function FingerShape({ finger, skin }: { finger: Finger; skin: string }) {
  const { base, tip, width } = finger;
  const length = Math.hypot(tip.x - base.x, tip.y - base.y);
  const nx = -(tip.y - base.y) / length;
  const ny = (tip.x - base.x) / length;

  const layer = (offset: number, strokeWidth: number, color: string, opacity = 1) => (
    <line
      x1={base.x + nx * offset}
      y1={base.y + ny * offset}
      x2={tip.x + nx * offset}
      y2={tip.y + ny * offset}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={opacity}
    />
  );

  return (
    <g>
      {layer(width * 0.08, width, mixHex(skin, '#1C1917', 0.22))}
      {layer(-width * 0.04, width * 0.9, skin)}
      {layer(-width * 0.2, width * 0.22, mixHex(skin, '#FFFFFF', 0.4), 0.5)}
    </g>
  );
}

type NailProps = {
  finger: Finger;
  shape: NailShape;
  extension: number;
  color: string;
  pattern: Pattern;
  accent: string;
  finish: Finish;
  clipId: string;
  ids: NailIds;
  seed: number;
};

function Nail({
  finger,
  shape,
  extension,
  color,
  pattern,
  accent,
  finish,
  clipId,
  ids,
  seed,
}: NailProps) {
  const { base, tip, width } = finger;
  const length = Math.hypot(tip.x - base.x, tip.y - base.y);
  const ux = (tip.x - base.x) / length;
  const uy = (tip.y - base.y) / length;

  // Local space: origin at the cuticle, negative y points outward along the finger.
  const hw = width * 0.36;
  const h = width * (0.7 + extension);
  const cx = tip.x - ux * width * 0.2;
  const cy = tip.y - uy * width * 0.2;
  const rotation = (Math.atan2(ux, -uy) * 180) / Math.PI;

  const d = nailPath(shape, hw, h);
  const clip = `url(#${clipId})`;
  const fill = pattern === 'ombre' ? `url(#${ids.ombre})` : color;
  const frenchD = `M${-hw - 2} ${-h - 2} L${hw + 2} ${-h - 2} L${hw + 2} ${-h * 0.7} Q0 0 ${-hw - 2} ${-h * 0.7} Z`;
  const microD = `M${-hw - 2} ${-h * 0.9} Q0 ${-h * 0.5} ${hw + 2} ${-h * 0.9}`;
  const glossD = `M${-hw * 0.45} ${-h * 0.2} Q${-hw * 0.25} ${-h * 0.85} ${hw * 0.15} ${-h * 0.92}`;
  const dots = pattern === 'polka' ? polkaDots(hw, h) : [];
  const sparks = finish === 'glitter' ? sparkles(hw, h, seed) : [];

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>

      <path d={d} fill={fill} />

      <g clipPath={clip}>
        {pattern === 'french' && <path d={frenchD} fill={accent} />}
        {pattern === 'microFrench' && (
          <path
            d={microD}
            fill="none"
            stroke={accent}
            strokeWidth={Math.max(1.2, width * 0.035)}
          />
        )}
        {dots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={hw * 0.14} fill={accent} />
        ))}

        {/* Shadow layer: darker sides give the nail its curvature. */}
        <path d={d} fill={`url(#${ids.shade})`} style={BLEND_MULTIPLY} />

        {/* Highlight layer, depends on the finish. */}
        {finish === 'gloss' && (
          <path
            d={glossD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={Math.max(1.4, width * 0.06)}
            strokeLinecap="round"
            opacity={0.9}
            style={BLEND_SCREEN}
          />
        )}
        {finish === 'matte' && <path d={d} fill="#FFFFFF" opacity={0.05} />}
        {finish === 'chrome' && (
          <path d={d} fill={`url(#${ids.chrome})`} opacity={0.9} style={BLEND_SCREEN} />
        )}
        {finish === 'glitter' && (
          <g>
            <rect
              x={-hw - 2}
              y={-h - 2}
              width={hw * 2 + 4}
              height={h + 4}
              filter={`url(#${ids.noise})`}
              opacity={0.85}
              style={BLEND_SCREEN}
            />
            {sparks.map((spark, i) => (
              <circle key={i} cx={spark.x} cy={spark.y} r={spark.r} fill="#FFFFFF" opacity={0.9} />
            ))}
          </g>
        )}
      </g>
    </g>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('SVG kon niet worden geladen'));
    image.src = src;
  });
}

async function downloadPng(svg: SVGSVGElement, fileName: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(EXPORT_WIDTH));
  clone.setAttribute('height', String(EXPORT_HEIGHT));

  const xml = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is niet beschikbaar');

    context.fillStyle = CANVAS_BG;
    context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    context.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG kon niet worden gemaakt');

    const link = document.createElement('a');
    const pngUrl = URL.createObjectURL(blob);
    link.href = pngUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

const optionClass = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe motion-reduce:transition-none ${
    active
      ? 'border-primary bg-primary text-canvas'
      : 'border-primary/20 text-primary hover:border-primary/50'
  }`;

const sectionTitle = 'text-xs font-semibold uppercase tracking-[0.12em] text-primary/60';

export default function NailConfigurator() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [status, setStatus] = useState('');

  const update = <K extends keyof Design>(key: K, value: Design[K]) =>
    setDesign((current) => ({ ...current, [key]: value }));

  const ids: NailIds = {
    shade: `${uid}-shade`,
    ombre: `${uid}-ombre`,
    chrome: `${uid}-chrome`,
    noise: `${uid}-noise`,
  };
  const palmId = `${uid}-palm`;
  const extension = LENGTHS.find((option) => option.id === design.length)?.extension ?? 0;
  const skinLight = mixHex(design.skin, '#FFFFFF', 0.3);
  const skinShade = mixHex(design.skin, '#1C1917', 0.25);

  const verrasMe = () => {
    setDesign({
      skin: pick(SKIN_TONES).hex,
      shape: pick(SHAPES).id,
      length: pick(LENGTHS).id,
      color: pick(COLOR_PRESETS).hex,
      accent: pick(COLOR_PRESETS).hex,
      finish: pick(FINISHES).id,
      pattern: pick(PATTERNS).id,
      accentRingOnly: Math.random() < 0.5,
    });
    setStatus('');
  };

  const handleDownload = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    setStatus('PNG wordt gemaakt…');
    try {
      await downloadPng(svg, `belise-nagelontwerp-${design.shape}.png`);
      setStatus('Ontwerp gedownload.');
    } catch {
      setStatus('Download mislukt. Probeer het opnieuw.');
    }
  };

  const shapeLabel = SHAPES.find((option) => option.id === design.shape)?.label ?? '';
  const lengthLabel = LENGTHS.find((option) => option.id === design.length)?.label ?? '';
  const finishLabel = FINISHES.find((option) => option.id === design.finish)?.label ?? '';

  return (
    <section aria-label="Nagel configurator" className="bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <div className="relative mx-auto aspect-[400/560] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-canvas to-taupe/70 ring-1 ring-taupe/30 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.35)]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              role="img"
              aria-label={`Nagelontwerp: ${shapeLabel}, ${lengthLabel}, ${finishLabel}`}
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id={ids.shade} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#1C1917" stopOpacity="0.28" />
                  <stop offset="0.28" stopColor="#1C1917" stopOpacity="0" />
                  <stop offset="0.72" stopColor="#1C1917" stopOpacity="0" />
                  <stop offset="1" stopColor="#1C1917" stopOpacity="0.28" />
                </linearGradient>
                <linearGradient id={ids.ombre} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={design.accent} />
                  <stop offset="1" stopColor={design.color} />
                </linearGradient>
                <linearGradient id={ids.chrome} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F7EDE4" />
                  <stop offset="0.3" stopColor="#CFC4DA" />
                  <stop offset="0.5" stopColor="#FFFFFF" />
                  <stop offset="0.72" stopColor="#C8D9D2" />
                  <stop offset="1" stopColor="#F3DCC8" />
                </linearGradient>
                <filter id={ids.noise} x="0" y="0" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.9"
                    numOctaves="2"
                    stitchTiles="stitch"
                    result="grain"
                  />
                  <feColorMatrix
                    in="grain"
                    type="matrix"
                    values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3 0 0 0 -1.6"
                  />
                </filter>
                <linearGradient id={palmId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={skinLight} />
                  <stop offset="0.55" stopColor={design.skin} />
                  <stop offset="1" stopColor={skinShade} />
                </linearGradient>
              </defs>

              <path d={PALM_PATH} fill={`url(#${palmId})`} />
              {FINGERS.map((finger) => (
                <FingerShape key={finger.id} finger={finger} skin={design.skin} />
              ))}
              {FINGERS.map((finger, index) => {
                const style = nailStyleFor(design, finger.id);
                return (
                  <Nail
                    key={finger.id}
                    finger={finger}
                    shape={design.shape}
                    extension={extension}
                    color={style.color}
                    pattern={style.pattern}
                    accent={design.accent}
                    finish={design.finish}
                    clipId={`${uid}-clip-${finger.id}`}
                    ids={ids}
                    seed={index + 1}
                  />
                );
              })}
            </svg>
          </div>

          <p className="mt-6 text-center text-sm text-primary/60">
            {shapeLabel} · {lengthLabel} · {finishLabel}
          </p>
        </div>

        <aside className="space-y-8 rounded-3xl bg-card p-6 ring-1 ring-taupe/25 sm:p-8">
          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Huidskleur</legend>
            <div className="flex flex-wrap gap-3">
              {SKIN_TONES.map((tone) => {
                const active = design.skin.toUpperCase() === tone.hex.toUpperCase();
                return (
                  <button
                    key={tone.hex}
                    type="button"
                    aria-label={tone.label}
                    aria-pressed={active}
                    onClick={() => update('skin', tone.hex)}
                    style={{ backgroundColor: tone.hex }}
                    className={`h-9 w-9 rounded-full border border-black/10 transition-transform duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
                      active ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas' : ''
                    }`}
                  />
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Vorm</legend>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={design.shape === option.id}
                  onClick={() => update('shape', option.id)}
                  className={optionClass(design.shape === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Lengte</legend>
            <div className="flex gap-2">
              {LENGTHS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={design.length === option.id}
                  onClick={() => update('length', option.id)}
                  className={optionClass(design.length === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Kleur</legend>
            <div className="flex flex-wrap items-center gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  aria-label={preset.label}
                  aria-pressed={design.color.toUpperCase() === preset.hex.toUpperCase()}
                  onClick={() => update('color', preset.hex)}
                  style={{ backgroundColor: preset.hex }}
                  className={`h-8 w-8 rounded-full border border-black/10 transition-transform duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
                    design.color.toUpperCase() === preset.hex.toUpperCase()
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas'
                      : ''
                  }`}
                />
              ))}
              <label className="flex items-center gap-2 text-sm text-primary/70">
                <input
                  type="color"
                  value={design.color}
                  onChange={(event) => update('color', event.target.value)}
                  aria-label="Vrije nagelkleur"
                  className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
                Eigen kleur
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Finish</legend>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={design.finish === option.id}
                  onClick={() => update('finish', option.id)}
                  className={optionClass(design.finish === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Patroon</legend>
            <div className="grid grid-cols-2 gap-2">
              {PATTERNS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={design.pattern === option.id}
                  onClick={() => update('pattern', option.id)}
                  className={optionClass(design.pattern === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-4 pt-2 text-sm text-primary/70">
              Accentkleur
              <input
                type="color"
                value={design.accent}
                onChange={(event) => update('accent', event.target.value)}
                aria-label="Accentkleur"
                className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Accentnagel</legend>
            <label className="flex items-center justify-between gap-4 text-sm text-primary">
              <span>Alleen op de ringvinger</span>
              <input
                type="checkbox"
                checked={design.accentRingOnly}
                onChange={(event) => update('accentRingOnly', event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>
            <p className="text-xs leading-relaxed text-primary/55">
              De overige vingers blijven effen. Bij Effen krijgt de ringvinger de accentkleur.
            </p>
          </fieldset>

          <div className="space-y-3 border-t border-taupe/30 pt-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={verrasMe}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-blush/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
              >
                <Shuffle size={16} aria-hidden="true" />
                Verras me
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
              >
                <Download size={16} aria-hidden="true" />
                Download ontwerp
              </button>
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-sm text-primary/60">
              {status}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}