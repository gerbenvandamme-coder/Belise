'use client';

import { useEffect, useState } from 'react';
import { fetchTreatmentCategories } from '@/lib/services';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/treatments';

/**
 * Tarieven voor client components. Start met de vaste prijslijst en wisselt naar public.services
 * zodra die geladen is, zodat de pagina nooit leeg is.
 */
export function useTreatmentCategories(): {
  categories: readonly TreatmentCategory[];
  loaded: boolean;
} {
  const [categories, setCategories] = useState<readonly TreatmentCategory[]>(TREATMENT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetchTreatmentCategories(supabase).then((result) => {
      if (cancelled) return;
      setCategories(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loaded };
}
