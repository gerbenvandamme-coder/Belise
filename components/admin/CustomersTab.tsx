'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Phone } from 'lucide-react';
import DecemberCounter from '@/components/admin/DecemberCounter';
import PhotoThumbs from '@/components/admin/PhotoThumbs';
import { supabase } from '@/lib/supabase';
import {
  BOOKING_STATUS_LABELS,
  formatDate,
  formatEuro,
  formatTime,
  parseTreatments,
} from '@/lib/admin/format';
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD_CLASS,
  FOCUS_RING,
  INPUT_CLASS,
  SECTION_LABEL,
} from '@/lib/admin/ui';
import type { AdminProfileRow, BookingRow } from '@/lib/database.types';

export default function CustomersTab() {
  const [profiles, setProfiles] = useState<AdminProfileRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('admin_profiles')
      .select('*')
      .order('full_name', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Klanten laden mislukt.');
          return;
        }
        setError(null);
        setProfiles(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const needle = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      (profiles ?? []).filter(
        (profile) =>
          !needle ||
          [profile.full_name, profile.email, profile.phone ?? ''].some((value) =>
            value.toLowerCase().includes(needle),
          ),
      ),
    [profiles, needle],
  );

  const selected = profiles?.find((profile) => profile.id === selectedId) ?? null;

  if (selected) {
    return (
      <CustomerDossier
        key={selected.id}
        profile={selected}
        onBack={() => setSelectedId(null)}
        onSaved={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DecemberCounter profiles={profiles} />

      <label className="block text-sm text-primary/80">
        Zoek op naam, e-mail of telefoon
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`mt-2 ${INPUT_CLASS}`}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {profiles === null && !error && <p className="text-sm text-primary/70">Klanten laden…</p>}
      {profiles !== null && visible.length === 0 && (
        <p className="text-sm text-primary/70">Geen klanten gevonden.</p>
      )}

      <ul className="space-y-2">
        {visible.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => setSelectedId(profile.id)}
              className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-taupe/40 bg-card px-4 py-3 text-left hover:bg-canvas ${FOCUS_RING}`}
            >
              <span className="font-medium text-primary">{profile.full_name}</span>
              <span className="truncate text-xs text-primary/60">
                {profile.phone ?? profile.email}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CustomerDossierProps = {
  profile: AdminProfileRow;
  onBack: () => void;
  onSaved: () => void;
};

function CustomerDossier({ profile, onBack, onSaved }: CustomerDossierProps) {
  const [hairFormula, setHairFormula] = useState(profile.hair_color_formula ?? '');
  const [nailPreferences, setNailPreferences] = useState(profile.nail_preferences ?? '');
  const [internalNotes, setInternalNotes] = useState(profile.internal_notes ?? '');
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('bookings')
      .select('*')
      .eq('client_id', profile.id)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus('Historiek laden mislukt.');
          setBookings([]);
          return;
        }
        setBookings(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        hair_color_formula: hairFormula.trim() || null,
        nail_preferences: nailPreferences.trim() || null,
        internal_notes: internalNotes.trim() || null,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      setStatus('Opslaan mislukt. Probeer opnieuw.');
      return;
    }
    setStatus('Dossier opgeslagen.');
    onSaved();
  }

  const hasAllergy = Boolean(profile.allergies && profile.allergy_consent_at);

  return (
    <div className="space-y-8">
      <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
        Terug naar klanten
      </button>

      <section aria-labelledby="contact-heading" className={`${CARD_CLASS} space-y-3`}>
        <h2 id="contact-heading" className={SECTION_LABEL}>
          Contact
        </h2>
        <p className="font-serif text-2xl text-primary">{profile.full_name}</p>
        {profile.phone ? (
          <a
            href={`tel:${profile.phone}`}
            className={`inline-flex min-h-12 items-center gap-2 text-sm text-accent-dark underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            {profile.phone}
          </a>
        ) : (
          <p className="text-sm text-primary/60">Geen telefoonnummer bekend</p>
        )}
        <p className="break-all text-sm text-primary/80">{profile.email}</p>
        {hasAllergy && (
          <p role="alert" className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white">
            Allergie: {profile.allergies}
          </p>
        )}
      </section>

      <form onSubmit={handleSave} className={`${CARD_CLASS} space-y-4`}>
        <h2 className={SECTION_LABEL}>Interne salonnotities</h2>
        <p className="text-xs text-primary/60">Alleen zichtbaar voor de salon.</p>

        <label className="block text-sm text-primary/80">
          Haarkleur & verfformule
          <textarea
            rows={3}
            value={hairFormula}
            onChange={(event) => setHairFormula(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        <label className="block text-sm text-primary/80">
          Favoriete nagelproduct / kleur / vorm
          <textarea
            rows={3}
            value={nailPreferences}
            onChange={(event) => setNailPreferences(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        <label className="block text-sm text-primary/80">
          Algemene interne opmerkingen
          <textarea
            rows={4}
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        {status && (
          <p role="status" className="text-sm text-primary/80">
            {status}
          </p>
        )}

        <button type="submit" disabled={saving} className={`${BUTTON_PRIMARY} w-full`}>
          {saving ? 'Opslaan…' : 'Dossier opslaan'}
        </button>
      </form>

      <section aria-labelledby="history-heading" className="space-y-3">
        <h2 id="history-heading" className={SECTION_LABEL}>
          Behandelhistoriek
        </h2>
        {bookings === null && <p className="text-sm text-primary/70">Historiek laden…</p>}
        {bookings !== null && bookings.length === 0 && (
          <p className="text-sm text-primary/70">Nog geen afspraken.</p>
        )}
        <ul className="space-y-3">
          {(bookings ?? []).map((booking) => (
            <li key={booking.id} className="space-y-2 rounded-2xl bg-canvas p-4">
              <p className="text-sm font-medium text-primary">
                {formatDate(booking.booking_date)} · {formatTime(booking.start_time)} –{' '}
                {formatTime(booking.end_time)}
              </p>
              <p className="text-xs uppercase tracking-widest text-primary/60">
                {BOOKING_STATUS_LABELS[booking.status]}
              </p>
              <ul className="text-sm text-primary/80">
                {parseTreatments(booking.treatments).map((treatment, index) => (
                  <li key={`${treatment.label}-${index}`}>{treatment.label}</li>
                ))}
              </ul>
              <p className="text-sm text-primary">{formatEuro(booking.total_price)}</p>
              <PhotoThumbs paths={[booking.reference_now_path, booking.inspiration_path]} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}