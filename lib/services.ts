import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ServiceRow } from '@/lib/database.types';
import {
  LENGTH_OPTIONS,
  TREATMENT_CATEGORIES,
  type LengthOption,
  type PerLength,
  type TreatmentCategory,
  type TreatmentItem,
} from '@/lib/treatments';

/**
 * Tarieven komen uit public.services (beheerd in /admin). Lukt dat niet, of is de tabel leeg,
 * dan valt de site terug op de vaste prijslijst in lib/treatments.ts.
 * Dit zijn publieke gegevens: er gaat geen klantdata mee.
 */

type LengthEntry = {
  price_euro?: number;
  active_duration_min?: number;
  processing_duration_min?: number;
};

function readPerLength(
  pricing: unknown,
  key: keyof LengthEntry,
  fallback: number | null,
): PerLength<number> | null {
  if (!pricing || typeof pricing !== 'object') return null;
  const result = {} as Record<LengthOption, number>;
  for (const option of LENGTH_OPTIONS) {
    const entry = (pricing as Record<string, LengthEntry | undefined>)[option];
    const value = entry?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[option] = value;
    } else if (fallback !== null) {
      result[option] = fallback;
    } else {
      return null;
    }
  }
  return result;
}

function rowToTreatment(row: ServiceRow): TreatmentItem | null {
  const base = { id: row.id, title: row.title, group: row.group_name ?? undefined };

  if (row.length_pricing) {
    const price = readPerLength(row.length_pricing, 'price_euro', null);
    const active = readPerLength(row.length_pricing, 'active_duration_min', null);
    const processing = readPerLength(row.length_pricing, 'processing_duration_min', 0);
    if (!price || !active || !processing) return null;
    return { ...base, priceEuro: price, activeDurationMin: active, processingDurationMin: processing };
  }

  if (row.price_euro === null || row.active_duration_min === null) return null;
  return {
    ...base,
    priceEuro: row.price_euro,
    activeDurationMin: row.active_duration_min,
    processingDurationMin: row.processing_duration_min ?? 0,
  };
}

/** Zet rijen uit public.services om naar categorieën. Titels en foto's per categorie blijven vast. */
export function rowsToCategories(rows: readonly ServiceRow[]): TreatmentCategory[] {
  const active = rows
    .filter((row) => row.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return TREATMENT_CATEGORIES.map((category) => ({
    ...category,
    treatments: active
      .filter((row) => row.category_id === category.id)
      .map(rowToTreatment)
      .filter((item): item is TreatmentItem => item !== null),
  }));
}

/** Haalt de tarieven op. Geeft de vaste prijslijst terug bij een fout of een lege tabel. */
export async function fetchTreatmentCategories(
  client: SupabaseClient<Database>,
): Promise<readonly TreatmentCategory[]> {
  try {
    const { data, error } = await client.from('services').select('*');
    if (error || !data || data.length === 0) return TREATMENT_CATEGORIES;
    const categories = rowsToCategories(data as ServiceRow[]);
    const total = categories.reduce((sum, category) => sum + category.treatments.length, 0);
    return total > 0 ? categories : TREATMENT_CATEGORIES;
  } catch {
    return TREATMENT_CATEGORIES;
  }
}
