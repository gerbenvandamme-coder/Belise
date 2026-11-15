import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PortfolioCategoryId, PortfolioItemRow } from '@/lib/database.types';

export const PORTFOLIO_BUCKET = 'portfolio';

export const PORTFOLIO_CATEGORIES: readonly { id: PortfolioCategoryId; title: string }[] = [
  { id: 'nails', title: 'Nagels' },
  { id: 'hair', title: 'Haarverzorging' },
  { id: 'waxing', title: 'Ontharing' },
  { id: 'massage', title: 'Massage' },
];

export type PortfolioEntry = {
  id: string;
  categoryId: PortfolioCategoryId;
  src: string;
  title: string;
  tags: string[];
  /** Uitgeknipte PNG zonder achtergrond: tonen zonder bijsnijden. */
  cutout: boolean;
};

/** Per categorie: tonen in een kader (true) of vrijstaand (false). Standaard vrijstaand. */
export type PortfolioFrames = Record<PortfolioCategoryId, boolean>;

export const NO_FRAMES: PortfolioFrames = { nails: false, hair: false, waxing: false, massage: false };

export const frameSettingKey = (categoryId: PortfolioCategoryId) => `portfolio_frame_${categoryId}`;

/** Zet de rijen uit site_settings om naar de kaderkeuze per categorie. */
export function parseFrames(rows: readonly { key: string; value: string }[] | null): PortfolioFrames {
  const frames: PortfolioFrames = { ...NO_FRAMES };
  for (const category of PORTFOLIO_CATEGORIES) {
    frames[category.id] = rows?.find((row) => row.key === frameSettingKey(category.id))?.value === 'true';
  }
  return frames;
}

export async function fetchPortfolioFrames(client: SupabaseClient<Database>): Promise<PortfolioFrames> {
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('key, value')
      .in('key', PORTFOLIO_CATEGORIES.map((category) => frameSettingKey(category.id)));
    return error ? { ...NO_FRAMES } : parseFrames(data);
  } catch {
    return { ...NO_FRAMES };
  }
}

/** Tag netjes maken: kleine letters, enkele spaties, max 30 tekens. Leeg = ongeldig. */
export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, ' ').slice(0, 30).trim();
  return tag ? tag : null;
}

export function rowToEntry(
  row: PortfolioItemRow,
  client: SupabaseClient<Database>,
): PortfolioEntry {
  const { data } = client.storage.from(PORTFOLIO_BUCKET).getPublicUrl(row.image_path);
  const category = PORTFOLIO_CATEGORIES.find((item) => item.id === row.category_id);
  return {
    id: row.id,
    categoryId: row.category_id,
    src: data.publicUrl,
    title: row.title?.trim() || category?.title || 'Belise',
    tags: row.tags ?? [],
    cutout: row.has_transparency === true,
  };
}

/** Gepubliceerde portfolio-items, nieuwste eerst. Leeg bij een fout. */
export async function fetchPortfolio(client: SupabaseClient<Database>): Promise<PortfolioEntry[]> {
  try {
    const { data, error } = await client
      .from('portfolio_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as PortfolioItemRow[]).map((row) => rowToEntry(row, client));
  } catch {
    return [];
  }
}
