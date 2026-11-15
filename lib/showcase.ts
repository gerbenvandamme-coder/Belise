import { readdirSync } from 'node:fs';
import path from 'node:path';

/** Uitgeknipte nagelsets in public/assets/showcase_cutouts/, gelezen tijdens de build. */
export type Cutout = { src: string; name: string };

const CUTOUT_DIR = path.join(process.cwd(), 'public', 'assets', 'showcase_cutouts');

export function loadCutouts(): Cutout[] {
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
