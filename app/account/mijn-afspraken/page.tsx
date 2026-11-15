'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import DeleteAccountSection from '@/components/DeleteAccountSection';
import { supabase } from '@/lib/supabase';
import { getSignedReferenceUrl } from '@/lib/supabaseStorage';
import { toDateKey } from '@/lib/schedule';
import { formatPrice } from '@/lib/treatments';
import type { BookingRow, BookingStatus, Json } from '@/lib/database.types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; bookings: BookingRow[] };

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const MY_BOOKINGS_PATH = '/account/mijn-afspraken';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'In afwachting',
  confirmed: 'Bevestigd',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
  no_show: 'Niet verschenen',
};

const DATE_FORMAT = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatBookingDate(key: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return key;
  return DATE_FORMAT.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function readTreatmentLabels(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return [];
    if (typeof item.label === 'string') return [item.label];
    if (typeof item.title === 'string') return [item.title];
    return [];
  });
}

function ReferencePhoto({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSignedReferenceUrl(path)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <figure className="w-24">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="h-24 w-24 rounded-2xl border border-taupe/40 object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-24 w-24 items-center justify-center rounded-2xl border border-taupe/40 bg-canvas text-xs text-primary/50"
        >
          {failed ? 'Niet beschikbaar' : '...'}
        </div>
      )}
      <figcaption className="mt-1 text-xs text-primary/60">{label}</figcaption>
    </figure>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const labels = readTreatmentLabels(booking.treatments);

  return (
    <li className="rounded-3xl border border-taupe/40 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl text-primary first-letter:uppercase">
            {formatBookingDate(booking.booking_date)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary/70">
            <Clock size={14} aria-hidden="true" />
            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
          </p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark">
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      {labels.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-primary">
          {labels.map((label, index) => (
            <li key={`${label}-${index}`}>{label}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-primary/70">
        Totaal <span className="font-serif text-lg text-primary">{formatPrice(booking.total_price)}</span>
      </p>

      {booking.client_notes && (
        <p className="mt-3 text-sm text-primary/70">Opmerking: {booking.client_notes}</p>
      )}

      {(booking.reference_now_path || booking.inspiration_path) && (
        <div className="mt-4 flex flex-wrap gap-4">
          {booking.reference_now_path && (
            <ReferencePhoto path={booking.reference_now_path} label="Huidige situatie" />
          )}
          {booking.inspiration_path && (
            <ReferencePhoto path={booking.inspiration_path} label="Inspiratie" />
          )}
        </div>
      )}

      {booking.photo_social_consent && (
        <p className="mt-4 text-xs text-primary/60">
          Je gaf toestemming om foto's van het resultaat op Instagram te delen.
        </p>
      )}
    </li>
  );
}

function BookingSection({ title, bookings }: { title: string; bookings: BookingRow[] }) {
  if (bookings.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-normal text-primary">{title}</h2>
      <ul className="mt-4 space-y-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </ul>
    </section>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!userData.user) {
          router.replace(`/account?next=${encodeURIComponent(MY_BOOKINGS_PATH)}`);
          return;
        }

        // RLS beperkt dit tot de eigen boekingen van de klant.
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: false });
        if (cancelled) return;

        if (error) {
          setState({ status: 'error' });
          return;
        }
        setState({ status: 'ready', bookings: data ?? [] });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const todayKey = toDateKey(new Date());
  const bookings = state.status === 'ready' ? state.bookings : [];
  const isUpcoming = (booking: BookingRow) =>
    booking.booking_date >= todayKey &&
    (booking.status === 'pending' || booking.status === 'confirmed');
  const upcoming = bookings.filter(isUpcoming).reverse();
  const past = bookings.filter((booking) => !isUpcoming(booking));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 lg:py-24">
      <Link
        href="/account"
        className={`inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary/70 transition-colors hover:text-accent-dark ${FOCUS_RING}`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Mijn account
      </Link>

      <h1 className="mt-8 font-serif text-4xl font-normal leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
        Mijn afspraken
      </h1>

      {state.status === 'loading' && (
        <p role="status" className="mt-8 text-sm text-primary/60">
          Je afspraken worden geladen...
        </p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-red-700">
          Je afspraken konden niet worden geladen. Probeer het later opnieuw.
        </p>
      )}

      {state.status === 'ready' && bookings.length === 0 && (
        <div className="mt-8">
          <p className="text-base text-primary/70">Je hebt nog geen afspraken.</p>
          <Link
            href="/booking"
            className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark motion-reduce:transition-none ${FOCUS_RING}`}
          >
            Afspraak maken
          </Link>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <BookingSection title="Aankomend" bookings={upcoming} />
          <BookingSection title="Eerdere afspraken" bookings={past} />
          <DeleteAccountSection bookings={bookings} />
        </>
      )}
    </main>
  );
}