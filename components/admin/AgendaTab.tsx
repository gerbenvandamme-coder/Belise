'use client';

import { useEffect, useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import PhotoThumbs from '@/components/admin/PhotoThumbs';
import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/schedule';
import type { AdminProfileRow, BookingRow, BookingStatus } from '@/lib/database.types';
import {
  BOOKING_STATUS_LABELS,
  formatDate,
  formatEuro,
  formatTime,
  parseTreatments,
} from '@/lib/admin/format';
import { BUTTON_SECONDARY, CARD_CLASS, FOCUS_RING, SECTION_LABEL } from '@/lib/admin/ui';

type Filter = 'today' | 'upcoming' | 'date';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'today', label: 'Vandaag' },
  { id: 'upcoming', label: 'Aankomend' },
  { id: 'date', label: 'Kies datum' },
];

const STATUS_ACTIONS: { status: BookingStatus; label: string }[] = [
  { status: 'confirmed', label: 'Bevestigen' },
  { status: 'completed', label: 'Afgerond' },
  { status: 'no_show', label: 'No-show' },
  { status: 'cancelled', label: 'Annuleren' },
];

type AgendaData = {
  bookings: BookingRow[];
  profiles: Record<string, AdminProfileRow>;
};

export default function AgendaTab() {
  const [filter, setFilter] = useState<Filter>('today');
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [data, setData] = useState<AgendaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = toDateKey(new Date());
      const base = supabase.from('bookings').select('*');
      const filtered =
        filter === 'today'
          ? base.eq('booking_date', today)
          : filter === 'upcoming'
            ? base.gte('booking_date', today)
            : base.eq('booking_date', selectedDate);

      const { data: rows, error: bookingError } = await filtered
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });
      if (cancelled) return;
      if (bookingError) {
        setError('Boekingen laden mislukt.');
        return;
      }

      const bookings = rows ?? [];
      const clientIds = [
        ...new Set(
          bookings.map((booking) => booking.client_id).filter((id): id is string => id !== null),
        ),
      ];

      let profiles: Record<string, AdminProfileRow> = {};
      if (clientIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from('admin_profiles')
          .select('*')
          .in('id', clientIds);
        if (cancelled) return;
        if (profileError) {
          setError('Klantgegevens laden mislukt.');
          return;
        }
        profiles = Object.fromEntries(
          (profileRows ?? []).map((profile): [string, AdminProfileRow] => [profile.id, profile]),
        );
      }

      setError(null);
      setData({ bookings, profiles });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, selectedDate, reloadToken]);

  const groups = useMemo(() => {
    const byDate = new Map<string, BookingRow[]>();
    for (const booking of data?.bookings ?? []) {
      const list = byDate.get(booking.booking_date) ?? [];
      list.push(booking);
      byDate.set(booking.booking_date, list);
    }
    return [...byDate.entries()];
  }, [data]);

  async function setStatus(bookingId: string, status: BookingStatus) {
    setBusyId(bookingId);
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    setBusyId(null);

    if (updateError) {
      setError('Status opslaan mislukt. Probeer opnieuw.');
      return;
    }
    setReloadToken((token) => token + 1);
  }

  const profiles = data?.profiles ?? {};

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Datumfilter" className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
            className={`${BUTTON_SECONDARY} ${filter === option.id ? '!bg-accent !text-white' : ''}`}
          >
            {option.label}
          </button>
        ))}
        {filter === 'date' && (
          <input
            type="date"
            aria-label="Kies een datum"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className={`min-h-12 rounded-full border border-taupe/50 bg-card px-4 text-base text-primary ${FOCUS_RING}`}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {data === null && !error && <p className="text-sm text-primary/70">Agenda laden…</p>}
      {data !== null && groups.length === 0 && (
        <p className="text-sm text-primary/70">Geen boekingen in deze selectie.</p>
      )}

      {groups.map(([date, bookings]) => (
        <section key={date} aria-labelledby={`day-${date}`} className="space-y-3">
          <h2 id={`day-${date}`} className={SECTION_LABEL}>
            {formatDate(date)}
          </h2>
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard
                  booking={booking}
                  profile={booking.client_id ? profiles[booking.client_id] : undefined}
                  busy={busyId === booking.id}
                  onStatus={setStatus}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

type BookingCardProps = {
  booking: BookingRow;
  profile: AdminProfileRow | undefined;
  busy: boolean;
  onStatus: (bookingId: string, status: BookingStatus) => void;
};

function BookingCard({ booking, profile, busy, onStatus }: BookingCardProps) {
  const treatments = parseTreatments(booking.treatments);
  const hasAllergy = Boolean(profile?.allergies && profile.allergy_consent_at);
  const phone = profile?.phone ?? null;
  const photoPaths = [booking.reference_now_path, booking.inspiration_path];
  const hasPhotos = photoPaths.some(Boolean);

  return (
    <article className={`${CARD_CLASS} space-y-4`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-2xl text-primary">
          {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
        </p>
        <span className="text-xs uppercase tracking-widest text-primary/60">
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </header>

      <div className="space-y-2">
        <p className="font-medium text-primary">{profile?.full_name ?? 'Onbekende klant'}</p>
        {phone ? (
          <a
            href={`tel:${phone}`}
            className={`inline-flex min-h-12 items-center gap-2 text-sm text-accent-dark underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            {phone}
          </a>
        ) : (
          <p className="text-sm text-primary/60">Geen telefoonnummer bekend</p>
        )}
      </div>

      {hasAllergy && (
        <p role="alert" className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white">
          Allergie: {profile?.allergies}
        </p>
      )}

      <ul className="space-y-1 text-sm text-primary">
        {treatments.map((treatment, index) => (
          <li key={`${treatment.label}-${index}`} className="flex justify-between gap-4">
            <span>{treatment.label}</span>
            {treatment.priceEuro !== null && <span>{formatEuro(treatment.priceEuro)}</span>}
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium text-primary">Totaal: {formatEuro(booking.total_price)}</p>

      {booking.client_notes && (
        <p className="text-sm text-primary/80">Opmerking klant: {booking.client_notes}</p>
      )}

      {hasPhotos && (
        <div className="space-y-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              booking.photo_social_consent ? 'bg-accent-soft text-accent-dark' : 'bg-taupe/30 text-primary'
            }`}
          >
            {booking.photo_social_consent ? 'IG-toestemming OK' : 'Niet delen op IG'}
          </span>
          <PhotoThumbs paths={photoPaths} />
        </div>
      )}

      <div role="group" aria-label="Status wijzigen" className="grid grid-cols-2 gap-2">
        {STATUS_ACTIONS.map((action) => {
          const current = booking.status === action.status;
          return (
            <button
              key={action.status}
              type="button"
              disabled={busy}
              aria-pressed={current}
              onClick={() => onStatus(booking.id, action.status)}
              className={`min-h-12 rounded-2xl px-3 text-sm font-medium transition-colors motion-reduce:transition-none disabled:opacity-50 ${
                current ? 'bg-accent text-white' : 'border border-taupe/50 bg-canvas text-primary'
              } ${FOCUS_RING}`}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}