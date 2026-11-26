import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createDemoClient } from '@/lib/demoSupabase';

/**
 * Server-side client zonder sessie, enkel voor publieke gegevens (tarieven, instellingen).
 * Nooit gebruiken voor klantgegevens. Geeft null als de omgevingsvariabelen ontbreken,
 * zodat een build zonder Supabase-configuratie terugvalt op de vaste prijslijst.
 */
export function createPublicSupabase(): SupabaseClient<Database> | null {
  if (
    process.env.NEXT_PUBLIC_ADMIN_DEMO === '1' ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'demo-admin'
  ) {
    return createDemoClient() as unknown as SupabaseClient<Database>;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
