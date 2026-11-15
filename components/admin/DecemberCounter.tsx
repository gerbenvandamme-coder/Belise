'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminProfileRow } from '@/lib/database.types';
import { CARD_CLASS, FOCUS_RING, SECTION_LABEL } from '@/lib/admin/ui';

/**
 * Teller voor de decemberactie: 1 behandeling in december = 1 kaartje.
 * Telt enkel bevestigde en afgeronde afspraken; geannuleerd en no-show tellen niet.
 * Het systeem trekt zelf geen winnaar: dat gebeurt buiten de software.
 */
type Row = { clientId: string; name: string; contact: string; tickets: number; visits: number };

function decemberRange(year: number): { from: string; to: string } {
  return { from: `${year}-12-01`, to: `${year}-12-31` };
}

function defaultYear(): number {
  const now = new Date();
  // Tot eind januari toont de teller nog de afgelopen december.
  return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
}

export default function DecemberCounter({
  profiles,
}: {
  profiles: readonly AdminProfileRow[] | null;
}) {
  const [year, setYear] = useState(defaultYear);
  const [counts, setCounts] = useState<Map<string, { tickets: number; visits: number }> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = decemberRange(year);
    setCounts(null);

    supabase
      .from('bookings')
      .select('client_id, treatments')
      .gte('booking_date', from)
      .lte('booking_date', to)
      .in('status', ['confirmed', 'completed'])
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Teller laden mislukt.');
          return;
        }
        setError(null);
        const map = new Map<string, { tickets: number; visits: number }>();
        for (const booking of data ?? []) {
          if (!booking.client_id) continue;
          const treatments = Array.isArray(booking.treatments) ? booking.treatments.length : 1;
          const current = map.get(booking.client_id) ?? { tickets: 0, visits: 0 };
          map.set(booking.client_id, {
            tickets: current.tickets + Math.max(1, treatments),
            visits: current.visits + 1,
          });
        }
        setCounts(map);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const rows = useMemo<Row[]>(() => {
    if (!counts) return [];
    const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return [...counts.entries()]
      .map(([clientId, value]) => {
        const profile = byId.get(clientId);
        return {
          clientId,
          name: profile?.full_name ?? 'Onbekende klant',
          contact: profile?.phone ?? profile?.email ?? '',
          ...value,
        };
      })
      .sort((a, b) => b.tickets - a.tickets || a.name.localeCompare(b.name, 'nl'));
  }, [counts, profiles]);

  const total = rows.reduce((sum, row) => sum + row.tickets, 0);

  return (
    <details className={CARD_CLASS}>
      <summary className={`cursor-pointer list-none rounded-xl ${FOCUS_RING}`}>
        <span className={SECTION_LABEL}>Decemberactie</span>
        <span className="mt-1 block text-sm text-primary/70">
          Kaartjes per klant: 1 behandeling in december = 1 kaartje.
        </span>
      </summary>

      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-3 text-sm text-primary/80">
          Jaar
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className={`min-h-12 rounded-2xl border border-taupe/50 bg-canvas px-4 ${FOCUS_RING}`}
          >
            {[defaultYear() - 1, defaultYear(), defaultYear() + 1].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <p className="text-xs leading-relaxed text-primary/60">
          Enkel bevestigde en afgeronde afspraken tellen. Zet een afspraak na het bezoek op
          &quot;Afgerond&quot;; geannuleerde afspraken en no-shows tellen niet mee.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {!counts && !error && <p className="text-sm text-primary/70">Teller laden…</p>}
        {counts && rows.length === 0 && (
          <p className="text-sm text-primary/70">Nog geen kaartjes voor december {year}.</p>
        )}

        {rows.length > 0 && (
          <>
            <p className="text-sm font-medium text-primary">
              {total} kaartje{total === 1 ? '' : 's'} bij {rows.length} klant
              {rows.length === 1 ? '' : 'en'}
            </p>
            <ol className="divide-y divide-taupe/30 rounded-2xl ring-1 ring-taupe/30">
              {rows.map((row) => (
                <li key={row.clientId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-primary">{row.name}</span>
                    <span className="block truncate text-xs text-primary/55">
                      {row.contact} · {row.visits} bezoek{row.visits === 1 ? '' : 'en'}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-dark">
                    {row.tickets}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </details>
  );
}
