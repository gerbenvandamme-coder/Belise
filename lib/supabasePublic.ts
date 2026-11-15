import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Server-side client zonder sessie, enkel voor publieke gegevens (tarieven, instellingen).
 * Nooit gebruiken voor klantgegevens. Geeft null als de omgevingsvariabelen ontbreken,
 * zodat een build zonder Supabase-configuratie terugvalt op de vaste prijslijst.
 */
export function createPublicSupabase(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
