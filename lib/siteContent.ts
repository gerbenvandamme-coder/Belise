import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { ABOUT, isFilledIn } from '@/lib/salon';
import { PORTFOLIO_BUCKET } from '@/lib/portfolio';

/**
 * Inhoud die de eigenares zelf beheert in /admin → Website.
 * Bewaard in site_settings; foto's staan in de publieke bucket 'portfolio' onder site/.
 * Ontbreekt iets, dan valt de site terug op de vaste waarden in lib/salon.ts.
 */
export const SITE_KEYS = {
  ownerName: 'site_owner_name',
  story: 'site_about_story',
  heroPhoto: 'site_hero_photo',
  heroCutout: 'site_hero_cutout',
  aboutPhoto: 'site_about_photo',
  salonPhotos: 'site_salon_photos',
} as const;

export const DEFAULT_HERO_PHOTO = '/assets/Front/Clean%20front%20picture.jpg';
export const DEFAULT_HERO_CUTOUT = '/assets/Front/front-cutout.webp';

export type SiteContent = {
  ownerName: string | null;
  story: string[];
  heroPhoto: string;
  /** Uitgeknipte versie die boven het kader uitsteekt. Null: enkel de foto in het kader. */
  heroCutout: string | null;
  aboutPhoto: string;
  salonPhotos: string[];
  /** True als de hoofdfoto de standaardfoto is (met de bijpassende uitsnede). */
  heroIsDefault: boolean;
};

/** Verhaal: alinea's gescheiden door een lege regel. */
export function splitStory(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function parseSalonPhotos(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function storagePublicUrl(client: SupabaseClient<Database>, path: string): string {
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return client.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function defaultSiteContent(): SiteContent {
  return {
    ownerName: isFilledIn(ABOUT.ownerName) ? ABOUT.ownerName : null,
    story: [...ABOUT.story],
    heroPhoto: DEFAULT_HERO_PHOTO,
    heroCutout: DEFAULT_HERO_CUTOUT,
    aboutPhoto: DEFAULT_HERO_PHOTO,
    salonPhotos: ABOUT.photos.map((photo) => photo.src),
    heroIsDefault: true,
  };
}

/** Leest de beheerde inhoud. Bij een fout of zonder database: de vaste waarden. */
export async function fetchSiteContent(client: SupabaseClient<Database> | null): Promise<SiteContent> {
  const fallback = defaultSiteContent();
  if (!client) return fallback;
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SITE_KEYS));
    if (error || !data) return fallback;
    const map = Object.fromEntries(data.map((row) => [row.key, row.value])) as Record<string, string>;
    const url = (path: string | undefined) => (path ? storagePublicUrl(client, path) : null);

    const heroPhoto = url(map[SITE_KEYS.heroPhoto]);
    const story = map[SITE_KEYS.story] ? splitStory(map[SITE_KEYS.story]) : fallback.story;
    const salonPaths = parseSalonPhotos(map[SITE_KEYS.salonPhotos]);

    return {
      ownerName: map[SITE_KEYS.ownerName]?.trim() || fallback.ownerName,
      story,
      heroPhoto: heroPhoto ?? fallback.heroPhoto,
      // Een eigen hoofdfoto krijgt enkel een uitsnede als die ook is opgeladen.
      heroCutout: heroPhoto ? url(map[SITE_KEYS.heroCutout]) : fallback.heroCutout,
      aboutPhoto: url(map[SITE_KEYS.aboutPhoto]) ?? heroPhoto ?? fallback.aboutPhoto,
      salonPhotos: salonPaths.length > 0 ? salonPaths.map((path) => storagePublicUrl(client, path)) : fallback.salonPhotos,
      heroIsDefault: !heroPhoto,
    };
  } catch {
    return fallback;
  }
}
