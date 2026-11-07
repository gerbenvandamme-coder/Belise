import { readdirSync } from 'node:fs';
import path from 'node:path';
import NailCarouselClient, { type CarouselItem } from './NailCarouselClient';

const CUTOUT_DIR = path.join(process.cwd(), 'public', 'assets', 'showcase_cutouts');

/**
 * Leest alle PNG's uit public/assets/showcase_cutouts/ tijdens de build.
 * Nieuwe bestanden verschijnen na een nieuwe build (npm run build).
 */
function loadCutouts(): CarouselItem[] {
  let files: string[];

  try {
    files = readdirSync(CUTOUT_DIR);
  } catch {
    return [];
  }

  return files
    .filter((file) => file.toLowerCase().endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }))
    .map((file, index) => ({
      src: `/assets/showcase_cutouts/${encodeURIComponent(file)}`,
      name: `Set ${String(index + 1).padStart(2, '0')}`,
    }));
}

export default function NailCarouselShowcase() {
  const items = loadCutouts();

  return <NailCarouselClient items={items} />;
}