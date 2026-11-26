import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createDemoClient } from '@/lib/demoSupabase';

/**
 * Demo-modus voor showcases: voorbeeldgegevens in het geheugen, geen database, admin zonder login.
 * Alleen aan op de preview-branch `demo-admin` of met NEXT_PUBLIC_ADMIN_DEMO=1. Nooit op productie.
 */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_ADMIN_DEMO === '1' ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'demo-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True als de Supabase-sleutels ingesteld zijn. Zonder sleutels werken login en boeken niet. */
export const isSupabaseConfigured = DEMO_MODE || Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && !DEMO_MODE) {
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
export const supabase: SupabaseClient<Database> = DEMO_MODE
  ? (createDemoClient() as unknown as SupabaseClient<Database>)
  : createBrowserClient<Database>(
      supabaseUrl || 'https://supabase-niet-geconfigureerd.invalid',
      supabaseAnonKey || 'ontbreekt',
    );
