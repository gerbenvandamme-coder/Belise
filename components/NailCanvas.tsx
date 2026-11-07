'use client';

import { useEffect, useRef, useState } from 'react';

export type NailFinish = 'glossy' | 'matte' | 'chrome';
export type NailPattern = 'solid' | 'french' | 'micro-french' | 'ombre' | 'dots';

export type NailCanvasProps = {
  /** Nagelvorm, bijvoorbeeld 'square', 'almond' of 'squoval'. */
  shape: string;
  /** Nagellengte, bijvoorbeeld 'short', 'medium' of 'long'. */
  length: string;
  baseColor: string;
  finish: NailFinish;
  pattern: NailPattern;
  accentColor: string;
  /**
   * Accentnagel: het patroon (of bij 'solid' de accentkleur) komt alleen op de ringvinger.
   * De andere nagels blijven effen in de basiskleur.
   */
  accentRingOnly: boolean;
  className?: string;
};

type Bounds = { x: number; y: number; width: number; height: number };

/** Eén nagel uit het masker, met een eigen masker op de grootte van zijn bounding box. */
type Nail = { bounds: Bounds; mask: HTMLCanvasElement };

type MaskAnalysis = { nails: Nail[]; accentIndex: number };

type Assets = MaskAnalysis & {
  hand: HTMLImageElement;
  mask: HTMLImageElement;
  curvature: HTMLImageElement;
  gloss: HTMLImageElement;
};

type Layers = { nail: HTMLCanvasElement; scratch: HTMLCanvasElement };

type PaintOptions = {
  baseColor: string;
  accentColor: string;
  finish: NailFinish;
  pattern: NailPattern;
  accentRingOnly: boolean;
};

type NailArt = 'accent-fill' | Exclude<NailPattern, 'solid'>;

type ComponentStat = {
  label: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
};

const ASSET_BASE = '/assets';
const HAND_SRC = `${ASSET_BASE}/hand.png`;
const CURVATURE_SRC = `${ASSET_BASE}/overlays/curvature_shadow.png`;
const GLOSS_SRC = `${ASSET_BASE}/overlays/gloss_reflection.png`;

const SAFE_NAME = /^[a-z0-9_-]+$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const FALLBACK_BASE = '#1C1917';
const FALLBACK_ACCENT = '#D4B8A5';

const MATTE_GLOSS_OPACITY = 0.12;
const DOT_COLUMNS = 3;
const DOT_ROWS = 4;
const DOT_RADIUS_RATIO = 0.05;
const MASK_ALPHA_THRESHOLD = 8;
const MAX_COMPONENTS = 65535;
/** Componenten kleiner dan dit deel van de grootste component zijn ruis, geen nagel. */
const MIN_NAIL_AREA_RATIO = 0.05;
const FINGER_COUNT = 5;
/** Positie van de ringvinger als de duim links (3) of rechts (1) in de rij staat. */
const RING_INDEX_THUMB_LEFT = 3;
const RING_INDEX_THUMB_RIGHT = 1;

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const analysisCache = new WeakMap<HTMLImageElement, MaskAnalysis>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Verwijder de mislukte poging, zodat een volgende poging opnieuw laadt.
      imageCache.delete(src);
      reject(new Error(`Afbeelding kon niet worden geladen: ${src}`));
    };
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function createLayer(width: number, height: number): HTMLCanvasElement {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  return layer;
}

function buildNailMask(
  data: Uint8ClampedArray,
  labels: Uint16Array,
  stat: ComponentStat,
  imageWidth: number,
): HTMLCanvasElement {
  const width = stat.maxX - stat.minX + 1;
  const height = stat.maxY - stat.minY + 1;
  const canvas = createLayer(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is niet beschikbaar in deze browser.');

  const image = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (stat.minY + y) * imageWidth + stat.minX + x;
      if (labels[source] !== stat.label) continue;
      const target = (y * width + x) * 4;
      image.data[target] = 255;
      image.data[target + 1] = 255;
      image.data[target + 2] = 255;
      image.data[target + 3] = data[source * 4 + 3];
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Aanname: de vijf nagels staan in een rij naast elkaar en de duimnagel ligt lager dan de
 * pinknagel. Daarmee bepalen we of de duim links of rechts staat en welke nagel de ringvinger is.
 */
function pickAccentIndex(nails: readonly Nail[]): number {
  const count = nails.length;
  if (count !== FINGER_COUNT) return Math.min(RING_INDEX_THUMB_LEFT, count - 1);

  const centerY = (nail: Nail) => nail.bounds.y + nail.bounds.height / 2;
  const thumbIsLeft = centerY(nails[0]) > centerY(nails[count - 1]);
  return thumbIsLeft ? RING_INDEX_THUMB_LEFT : RING_INDEX_THUMB_RIGHT;
}

/** Splitst het masker in losse nagels (links naar rechts) en bepaalt de ringvinger. */
function analyzeMask(mask: HTMLImageElement): MaskAnalysis {
  const cached = analysisCache.get(mask);
  if (cached) return cached;

  const width = mask.naturalWidth;
  const height = mask.naturalHeight;
  if (width === 0 || height === 0) {
    throw new Error('Het nagelmasker heeft geen afmetingen.');
  }

  const scanCanvas = createLayer(width, height);
  const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is niet beschikbaar in deze browser.');

  ctx.drawImage(mask, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  const labels = new Uint16Array(width * height);
  const stack = new Int32Array(width * height);
  const stats: ComponentStat[] = [];

  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== 0 || data[start * 4 + 3] <= MASK_ALPHA_THRESHOLD) continue;
    if (stats.length >= MAX_COMPONENTS) break;

    const label = stats.length + 1;
    const stat: ComponentStat = {
      label,
      minX: width,
      minY: height,
      maxX: -1,
      maxY: -1,
      area: 0,
    };

    let top = 0;
    stack[top++] = start;
    labels[start] = label;

    const visit = (index: number) => {
      if (labels[index] === 0 && data[index * 4 + 3] > MASK_ALPHA_THRESHOLD) {
        labels[index] = label;
        stack[top++] = index;
      }
    };

    while (top > 0) {
      const index = stack[--top];
      const x = index % width;
      const y = (index - x) / width;

      stat.area++;
      if (x < stat.minX) stat.minX = x;
      if (x > stat.maxX) stat.maxX = x;
      if (y < stat.minY) stat.minY = y;
      if (y > stat.maxY) stat.maxY = y;

      if (x > 0) visit(index - 1);
      if (x < width - 1) visit(index + 1);
      if (y > 0) visit(index - width);
      if (y < height - 1) visit(index + width);
    }

    stats.push(stat);
  }

  let analysis: MaskAnalysis;

  if (stats.length === 0) {
    // Leeg masker: behandel de hele afbeelding als één nagel, zodat er niets crasht.
    analysis = {
      nails: [{ bounds: { x: 0, y: 0, width, height }, mask: scanCanvas }],
      accentIndex: 0,
    };
  } else {
    const largest = Math.max(...stats.map((stat) => stat.area));
    const nails: Nail[] = stats
      .filter((stat) => stat.area >= largest * MIN_NAIL_AREA_RATIO)
      .map((stat) => ({
        bounds: {
          x: stat.minX,
          y: stat.minY,
          width: stat.maxX - stat.minX + 1,
          height: stat.maxY - stat.minY + 1,
        },
        mask: buildNailMask(data, labels, stat, width),
      }))
      .sort((a, b) => a.bounds.x + a.bounds.width / 2 - (b.bounds.x + b.bounds.width / 2));

    analysis = { nails, accentIndex: pickAccentIndex(nails) };
  }

  analysisCache.set(mask, analysis);
  return analysis;
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: Exclude<NailPattern, 'solid'>,
  bounds: Bounds,
  baseColor: string,
  accentColor: string,
) {
  const { x, y, width, height } = bounds;

  switch (pattern) {
    case 'french': {
      // Aanname: de nageltop ligt aan de bovenkant van de nagel.
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 2);
      ctx.lineTo(x + width + 2, y - 2);
      ctx.lineTo(x + width + 2, y + height * 0.2);
      ctx.quadraticCurveTo(x + width / 2, y + height * 0.42, x - 2, y + height * 0.2);
      ctx.closePath();
      ctx.fillStyle = accentColor;
      ctx.fill();
      break;
    }
    case 'micro-french': {
      // Smalle tipbaan: dezelfde boogvorm als 'french', maar op ongeveer de helft van de hoogte.
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 2);
      ctx.lineTo(x + width + 2, y - 2);
      ctx.lineTo(x + width + 2, y + height * 0.1);
      ctx.quadraticCurveTo(x + width / 2, y + height * 0.2, x - 2, y + height * 0.1);
      ctx.closePath();
      ctx.fillStyle = accentColor;
      ctx.fill();
      break;
    }
    case 'ombre': {
      const gradient = ctx.createLinearGradient(0, y, 0, y + height);
      gradient.addColorStop(0, accentColor);
      gradient.addColorStop(1, baseColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
      break;
    }
    case 'dots': {
      const radius = Math.min(width, height) * DOT_RADIUS_RATIO;
      ctx.fillStyle = accentColor;
      for (let row = 0; row < DOT_ROWS; row++) {
        for (let col = 0; col < DOT_COLUMNS; col++) {
          const stagger = row % 2 === 1 ? width / (DOT_COLUMNS + 1) / 2 : 0;
          const cx = x + (width * (col + 1)) / (DOT_COLUMNS + 1) + stagger;
          const cy = y + (height * (row + 1)) / (DOT_ROWS + 1);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }
}

function drawChromeSheen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const sheen = ctx.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(0.55, 'rgba(0, 0, 0, 0.25)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

/** Bepaalt wat er op een nagel komt bovenop de basiskleur, of null als er niets bijkomt. */
function resolveNailArt(options: PaintOptions, isAccentNail: boolean): NailArt | null {
  if (options.accentRingOnly && !isAccentNail) return null;
  if (options.pattern === 'solid') return options.accentRingOnly ? 'accent-fill' : null;
  return options.pattern;
}

/**
 * Tekent kleur of patroon voor één nagel op een tijdelijk canvas, knipt dat met het eigen
 * masker van de nagel en zet het resultaat op de nagellaag. Zo lekt niets naar buurnagels.
 */
function paintNailArt(
  ctx: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  nail: Nail,
  art: NailArt,
  options: PaintOptions,
  scale: number,
) {
  const scratchCtx = scratch.getContext('2d');
  if (!scratchCtx) return;

  const { bounds } = nail;
  const originX = Math.floor(bounds.x * scale);
  const originY = Math.floor(bounds.y * scale);
  const width = Math.ceil((bounds.x + bounds.width) * scale) - originX;
  const height = Math.ceil((bounds.y + bounds.height) * scale) - originY;
  if (width <= 0 || height <= 0) return;

  // Nieuwe afmetingen wissen het canvas en zetten de context terug.
  scratch.width = width;
  scratch.height = height;
  scratchCtx.setTransform(scale, 0, 0, scale, -originX, -originY);

  scratchCtx.fillStyle = art === 'accent-fill' ? options.accentColor : options.baseColor;
  scratchCtx.fillRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);

  if (art !== 'accent-fill') {
    drawPattern(scratchCtx, art, bounds, options.baseColor, options.accentColor);
  }

  scratchCtx.globalCompositeOperation = 'destination-in';
  scratchCtx.drawImage(nail.mask, bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scratch, originX, originY);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

/** Tekent de nagels (kleur, patroon, schaduw, glans) en knipt die naar het masker. */
function paintNailLayer(layers: Layers, assets: Assets, options: PaintOptions, scale: number) {
  const layer = layers.nail;
  const ctx = layer.getContext('2d');
  if (!ctx) return;

  const { hand, mask, curvature, gloss, nails, accentIndex } = assets;
  const width = hand.naturalWidth;
  const height = hand.naturalHeight;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, layer.width, layer.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = options.baseColor;
  ctx.fillRect(0, 0, width, height);

  nails.forEach((nail, index) => {
    const art = resolveNailArt(options, index === accentIndex);
    if (art) paintNailArt(ctx, layers.scratch, nail, art, options, scale);
  });

  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(curvature, 0, 0, width, height);

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = options.finish === 'matte' ? MATTE_GLOSS_OPACITY : 1;
  ctx.drawImage(gloss, 0, 0, width, height);
  ctx.globalAlpha = 1;

  if (options.finish === 'chrome') {
    drawChromeSheen(ctx, width, height);
  }

  // Alles buiten het nagelmasker verdwijnt, dus schaduw en glans blijven op de nagel.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

function paintFrame(
  canvas: HTMLCanvasElement,
  assets: Assets,
  options: PaintOptions,
  layers: Layers,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = canvas.width / assets.hand.naturalWidth;

  paintNailLayer(layers, assets, options, scale);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(assets.hand, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(layers.nail, 0, 0);
}

export default function NailCanvas({
  shape,
  length,
  baseColor,
  finish,
  pattern,
  accentColor,
  accentRingOnly,
  className,
}: NailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Layers | null>(null);

  const [assets, setAssets] = useState<Assets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cssWidth, setCssWidth] = useState(0);

  const safeBase = HEX_COLOR.test(baseColor) ? baseColor : FALLBACK_BASE;
  const safeAccent = HEX_COLOR.test(accentColor) ? accentColor : FALLBACK_ACCENT;

  // Laad de afbeeldingen en het masker voor de gekozen vorm en lengte.
  useEffect(() => {
    if (!SAFE_NAME.test(shape) || !SAFE_NAME.test(length)) {
      setAssets(null);
      setError(`Onbekende nagelvorm of lengte: ${shape} / ${length}`);
      return;
    }

    let cancelled = false;
    const maskSrc = `${ASSET_BASE}/masks/${shape}_${length}.png`;

    Promise.all([
      loadImage(HAND_SRC),
      loadImage(maskSrc),
      loadImage(CURVATURE_SRC),
      loadImage(GLOSS_SRC),
    ])
      .then(([hand, mask, curvature, gloss]) => {
        if (cancelled) return;
        const analysis = analyzeMask(mask);
        setError(null);
        setAssets({ hand, mask, curvature, gloss, ...analysis });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAssets(null);
        setError(err instanceof Error ? err.message : 'Assets laden is mislukt.');
      });

    return () => {
      cancelled = true;
    };
  }, [shape, length]);

  // Volg de breedte van de container, zodat de canvas scherp blijft op elk formaat.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => setCssWidth(container.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Teken één frame per state-update via requestAnimationFrame.
  useEffect(() => {
    if (!assets || cssWidth === 0) return;

    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.round(cssWidth * dpr);
      const height = Math.round(width * (assets.hand.naturalHeight / assets.hand.naturalWidth));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      let layers = layersRef.current;
      if (!layers || layers.nail.width !== width || layers.nail.height !== height) {
        layers = { nail: createLayer(width, height), scratch: createLayer(1, 1) };
        layersRef.current = layers;
      }

      paintFrame(
        canvas,
        assets,
        {
          baseColor: safeBase,
          accentColor: safeAccent,
          finish,
          pattern,
          accentRingOnly,
        },
        layers,
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [assets, cssWidth, safeBase, safeAccent, finish, pattern, accentRingOnly]);

  const label = `Nagelvoorbeeld: ${shape}, ${length}, ${finish}, patroon ${pattern}`;
  const containerClass = [
    'relative w-full',
    assets ? '' : 'min-h-[16rem]',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={containerClass}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        aria-busy={!assets && !error}
        className="block h-auto w-full"
      />
      {!assets && !error && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-primary/60">
          Nagelbeeld laden…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}