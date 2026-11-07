'use client';

import { RotateCcw, Shuffle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NailFinish, NailPattern } from './NailCanvas';

export const NAIL_SHAPES = [
  { id: 'square', label: 'Square' },
  { id: 'squoval', label: 'Squoval' },
  { id: 'round', label: 'Rond' },
  { id: 'oval', label: 'Ovaal' },
  { id: 'almond', label: 'Amandel' },
  { id: 'coffin', label: 'Coffin' },
] as const;

export type NailShapeId = (typeof NAIL_SHAPES)[number]['id'];

export const NAIL_LENGTHS = [
  { id: 'short', label: 'Kort' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Lang' },
] as const;

export type NailLengthId = (typeof NAIL_LENGTHS)[number]['id'];

export const SALON_SWATCHES = [
  { name: 'Melkwit', hex: '#F5F0E8' },
  { name: 'Nude beige', hex: '#D8B9A0' },
  { name: 'Pastel roze', hex: '#F1C7CF' },
  { name: 'Diep bordeaux', hex: '#6B1E2E' },
  { name: 'Espresso', hex: '#1C1917' },
  { name: 'Saliegroen', hex: '#9CAF94' },
  { name: 'Zwart', hex: '#111111' },
] as const;

export const FINISH_OPTIONS: readonly { id: NailFinish; label: string }[] = [
  { id: 'glossy', label: 'Hoogglans Gellak' },
  { id: 'matte', label: 'Velvet Mat' },
  { id: 'chrome', label: 'Glazed Chroom' },
];

export const PATTERN_OPTIONS: readonly { id: NailPattern; label: string }[] = [
  { id: 'solid', label: 'Effen' },
  { id: 'french', label: 'Klassieke French' },
  { id: 'micro-french', label: 'Micro French' },
  { id: 'ombre', label: 'Ombre / Babyboomer' },
  { id: 'dots', label: 'Polka Dots' },
];

const RANDOM_ACCENTS: readonly string[] = ['#FFFFFF', '#D8B9A0', '#6B1E2E', '#9CAF94', '#C9A96E', '#1C1917'];

const RANDOM_RING_ONLY_CHANCE = 0.3;

export type NailConfig = {
  shape: NailShapeId;
  length: NailLengthId;
  baseColor: string;
  finish: NailFinish;
  pattern: NailPattern;
  accentColor: string;
  accentRingOnly: boolean;
};

export const DEFAULT_NAIL_CONFIG: NailConfig = {
  shape: 'almond',
  length: 'medium',
  baseColor: '#D8B9A0',
  finish: 'glossy',
  pattern: 'solid',
  accentColor: '#6B1E2E',
  accentRingOnly: false,
};

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function createRandomNailConfig(): NailConfig {
  return {
    shape: pick(NAIL_SHAPES).id,
    length: pick(NAIL_LENGTHS).id,
    baseColor: pick(SALON_SWATCHES).hex,
    finish: pick(FINISH_OPTIONS).id,
    pattern: pick(PATTERN_OPTIONS).id,
    accentColor: pick(RANDOM_ACCENTS),
    accentRingOnly: Math.random() < RANDOM_RING_ONLY_CHANCE,
  };
}

const SHAPE_ICON_PATHS: Record<NailShapeId, ReactNode> = {
  square: <rect x="7" y="3" width="10" height="18" rx="1" />,
  squoval: <rect x="7" y="3" width="10" height="18" rx="3.5" />,
  round: <circle cx="12" cy="12" r="6.5" />,
  oval: <ellipse cx="12" cy="12" rx="5.5" ry="8.5" />,
  almond: <path d="M7 21V11c0-4 2.5-7 5-8 2.5 1 5 4 5 8v10z" />,
  coffin: <path d="M7.5 21 9 4h6l1.5 17z" />,
};

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const OPTION_IDLE = 'border-taupe/50 text-primary hover:border-accent hover:bg-accent-soft';
const OPTION_ACTIVE = 'border-accent bg-accent text-white shadow-sm';

const OPTION_BASE = cx(
  'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
  FOCUS_RING,
);

function ShapeIcon({ shape }: { shape: NailShapeId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPE_ICON_PATHS[shape]}
    </svg>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

type NailControlsProps = {
  value: NailConfig;
  onChange: (next: NailConfig) => void;
};

export default function NailControls({ value, onChange }: NailControlsProps) {
  const update = (patch: Partial<NailConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-10 rounded-3xl bg-card p-6 shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25 sm:p-8">
      <ControlGroup title="Vorm">
        <div className="grid grid-cols-3 gap-3">
          {NAIL_SHAPES.map((shape) => {
            const active = value.shape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ shape: shape.id })}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none',
                  FOCUS_RING,
                  active ? OPTION_ACTIVE : OPTION_IDLE,
                )}
              >
                <ShapeIcon shape={shape.id} />
                {shape.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Lengte">
          {NAIL_LENGTHS.map((length) => {
            const active = value.length === length.id;
            return (
              <button
                key={length.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ length: length.id })}
                className={cx(OPTION_BASE, active ? OPTION_ACTIVE : OPTION_IDLE)}
              >
                {length.label}
              </button>
            );
          })}
        </div>
      </ControlGroup>

      <ControlGroup title="Kleur">
        <div className="flex flex-wrap gap-3" role="group" aria-label="Saloncollectie">
          {SALON_SWATCHES.map((swatch) => {
            const active = value.baseColor.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                aria-pressed={active}
                aria-label={swatch.name}
                title={swatch.name}
                onClick={() => update({ baseColor: swatch.hex })}
                className={cx(
                  'h-10 w-10 rounded-full border border-taupe/50 shadow-sm transition-transform duration-200 hover:scale-105 motion-reduce:transition-none',
                  FOCUS_RING,
                  active && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                )}
                style={{ backgroundColor: swatch.hex }}
              />
            );
          })}
        </div>

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-taupe/50 px-4 py-3 text-sm text-primary">
          <span className="font-medium">Vrije kleurkeuze</span>
          <input
            type="color"
            value={value.baseColor}
            onChange={(event) => update({ baseColor: event.target.value })}
            className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          />
        </label>
      </ControlGroup>

      <ControlGroup title="Finish">
        <div className="grid gap-2 sm:grid-cols-3">
          {FINISH_OPTIONS.map((finish) => {
            const active = value.finish === finish.id;
            return (
              <button
                key={finish.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ finish: finish.id })}
                className={cx(OPTION_BASE, active ? OPTION_ACTIVE : OPTION_IDLE)}
              >
                {finish.label}
              </button>
            );
          })}
        </div>
      </ControlGroup>

      <ControlGroup title="Patroon & nail art">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Patroon">
          {PATTERN_OPTIONS.map((pattern) => {
            const active = value.pattern === pattern.id;
            return (
              <button
                key={pattern.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ pattern: pattern.id })}
                className={cx(OPTION_BASE, active ? OPTION_ACTIVE : OPTION_IDLE)}
              >
                {pattern.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-taupe/50 px-4 py-3 text-sm text-primary">
          <span className="font-medium">Accentkleur</span>
          <input
            type="color"
            value={value.accentColor}
            onChange={(event) => update({ accentColor: event.target.value })}
            className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          />
        </label>

        <button
          type="button"
          role="switch"
          aria-checked={value.accentRingOnly}
          onClick={() => update({ accentRingOnly: !value.accentRingOnly })}
          className={cx(
            'flex w-full items-center justify-between gap-4 rounded-2xl border border-taupe/50 px-4 py-3 text-left transition-colors duration-200 hover:bg-blush/30',
            FOCUS_RING,
          )}
        >
          <span>
            <span className="block text-sm font-medium text-primary">Accentnagel</span>
            <span className="block text-xs text-primary/60">Toepassen op de ringvinger</span>
          </span>
          <span
            aria-hidden="true"
            className={cx(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              value.accentRingOnly ? 'bg-primary' : 'bg-taupe/50',
            )}
          >
            <span
              className={cx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform duration-200 motion-reduce:transition-none',
                value.accentRingOnly ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>
      </ControlGroup>

      <div className="flex flex-col gap-3 border-t border-taupe/30 pt-8 sm:flex-row">
        <button
          type="button"
          onClick={() => onChange(createRandomNailConfig())}
          className={cx(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-canvas shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
            FOCUS_RING,
          )}
        >
          <Shuffle size={16} aria-hidden="true" />
          Verras me
        </button>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_NAIL_CONFIG)}
          className={cx(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/25 px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:border-primary hover:bg-blush/40 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
            FOCUS_RING,
          )}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}