import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True als de Supabase-sleutels ingesteld zijn. Zonder sleutels werken login en boeken niet. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Niet gooien: anders faalt de hele build (elke pagina laadt deze module via de layout).
  // De site bouwt dan wel, maar login, boeken en tarieven uit de database werken niet.
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreken. Stel ze in bij de hosting.',
  );
}

/**
 * Browser-client. Sessies worden in de browser bewaard, dus er is geen server-tussenkomst.
 * Gebruik nooit de service-role key in deze applicatie.
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl || 'https://supabase-niet-geconfigureerd.invalid',
  supabaseAnonKey || 'ontbreekt',
);
