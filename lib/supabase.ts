import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY moeten zijn ingesteld.',
  );
}

/**
 * Browser-client. Sessies worden in de browser bewaard, dus er is geen server-tussenkomst.
 * Gebruik nooit de service-role key in deze applicatie.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);