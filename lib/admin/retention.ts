'use client';

import { supabase } from '@/lib/supabase';
import { BOOKING_BUCKET } from '@/lib/supabaseStorage';
import { PORTFOLIO_BUCKET } from '@/lib/portfolio';

/**
 * Bewaartermijnen uit de privacyverklaring (26/11/2026):
 * - foto's bij een boeking: 12 maanden na de afspraak;
 * - account, afspraken, salonnotities en no-shows: 3 jaar na de laatste afspraak.
 *
 * De opkuis draait in de browser van de beheerder, met haar eigen rechten (RLS),
 * hoogstens één keer per dag wanneer /admin geopend wordt. Zo is er geen service-sleutel nodig.
 */
export const BOOKING_PHOTO_MONTHS = 12;
export const INACTIVE_CLIENT_YEARS = 3;

const LAST_RUN_KEY = 'retention_last_run';

function dateKeyMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

export type RetentionResult = { photosRemoved: number; clientsErased: number } | null;

/** Draait de opkuis als die vandaag nog niet liep. Geeft null als er niets moest gebeuren. */
export async function runRetentionCleanup(): Promise<RetentionResult> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: lastRun } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', LAST_RUN_KEY)
    .maybeSingle();
  if (lastRun?.value === today) return null;

  let photosRemoved = 0;
  let clientsErased = 0;

  // 1. Foto's bij boekingen ouder dan 12 maanden.
  const photoCutoff = dateKeyMonthsAgo(BOOKING_PHOTO_MONTHS);
  const { data: oldBookings } = await supabase
    .from('bookings')
    .select('*')
    .lt('booking_date', photoCutoff)
    .limit(200);
  for (const booking of oldBookings ?? []) {
    const paths = [booking.reference_now_path, booking.inspiration_path].filter(
      (path): path is string => Boolean(path),
    );
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(BOOKING_BUCKET).remove(paths);
    if (error) continue;
    await supabase
      .from('bookings')
      .update({ reference_now_path: null, inspiration_path: null })
      .eq('id', booking.id);
    photosRemoved += paths.length;
  }

  // 2. Klanten zonder afspraak in de laatste 3 jaar, en zelf ouder dan 3 jaar.
  const clientCutoff = dateKeyMonthsAgo(INACTIVE_CLIENT_YEARS * 12);
  const [{ data: clients }, { data: recent }] = await Promise.all([
    supabase.from('admin_profiles').select('*').eq('role', 'client').lt('created_at', clientCutoff),
    supabase.from('bookings').select('*').gte('booking_date', clientCutoff),
  ]);
  const active = new Set((recent ?? []).map((booking) => booking.client_id));
  for (const client of clients ?? []) {
    if (active.has(client.id)) continue;
    const [{ data: ownBookings }, { data: ownPhotos }] = await Promise.all([
      supabase.from('bookings').select('*').eq('client_id', client.id),
      supabase.from('portfolio_items').select('*').eq('client_id', client.id),
    ]);
    const referencePaths = (ownBookings ?? [])
      .flatMap((booking) => [booking.reference_now_path, booking.inspiration_path])
      .filter((path): path is string => Boolean(path));
    if (referencePaths.length > 0) await supabase.storage.from(BOOKING_BUCKET).remove(referencePaths);
    const portfolioPaths = (ownPhotos ?? []).map((item) => item.image_path);
    if (portfolioPaths.length > 0) await supabase.storage.from(PORTFOLIO_BUCKET).remove(portfolioPaths);
    const { error } = await supabase.rpc('admin_delete_client', { p_client_id: client.id });
    if (!error) clientsErased += 1;
  }

  await supabase.from('site_settings').upsert({ key: LAST_RUN_KEY, value: today }, { onConflict: 'key' });
  return { photosRemoved, clientsErased };
}
