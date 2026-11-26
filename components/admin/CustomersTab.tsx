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
import { BOOKING_BUCKET } from '@/lib/supabaseStorage';
import { PORTFOLIO_BUCKET } from '@/lib/portfolio';

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
        onDeleted={() => {
          setSelectedId(null);
          setReloadToken((token) => token + 1);
        }}
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
              <span className="font-medium text-primary">
                {profile.full_name}
                {profile.no_show_count > 0 && (
                  <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800">
                    {profile.no_show_count}× no-show
                  </span>
                )}
              </span>
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
  onDeleted: () => void;
};

function CustomerDossier({ profile, onBack, onSaved, onDeleted }: CustomerDossierProps) {
  const [noShows, setNoShows] = useState(profile.no_show_count ?? 0);
  const [photoConsent, setPhotoConsent] = useState(profile.photo_consent === true);
  const [flagStatus, setFlagStatus] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const [erasing, setErasing] = useState(false);
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

  async function saveFlags(patch: { no_show_count?: number; photo_consent?: boolean }) {
    setFlagStatus(null);
    const update = {
      ...patch,
      ...(patch.photo_consent !== undefined
        ? { photo_consent_at: patch.photo_consent ? new Date().toISOString() : null }
        : {}),
    };
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id);
    if (error) {
      setFlagStatus('Opslaan mislukt. Probeer opnieuw.');
      return false;
    }
    setFlagStatus(
      patch.photo_consent === false
        ? 'Toestemming ingetrokken. Gekoppelde portfoliofoto\'s zijn offline gehaald.'
        : 'Opgeslagen.',
    );
    onSaved();
    return true;
  }

  async function changeNoShows(delta: number) {
    const next = Math.max(0, noShows + delta);
    if (next === noShows) return;
    const previous = noShows;
    setNoShows(next);
    if (!(await saveFlags({ no_show_count: next }))) setNoShows(previous);
  }

  async function toggleConsent() {
    const next = !photoConsent;
    setPhotoConsent(next);
    if (!(await saveFlags({ photo_consent: next }))) setPhotoConsent(!next);
  }

  /** Wist alles van deze klant: foto's in de opslag, afspraken, portfolio-koppelingen en het account. */
  async function eraseClient() {
    setErasing(true);
    setFlagStatus(null);
    const [{ data: ownBookings }, { data: ownPhotos }] = await Promise.all([
      supabase.from('bookings').select('*').eq('client_id', profile.id),
      supabase.from('portfolio_items').select('*').eq('client_id', profile.id),
    ]);
    const referencePaths = (ownBookings ?? [])
      .flatMap((booking) => [booking.reference_now_path, booking.inspiration_path])
      .filter((path): path is string => Boolean(path));
    const portfolioPaths = (ownPhotos ?? []).map((item) => item.image_path);
    if (referencePaths.length > 0) {
      await supabase.storage.from(BOOKING_BUCKET).remove(referencePaths);
    }
    if (portfolioPaths.length > 0) {
      await supabase.storage.from(PORTFOLIO_BUCKET).remove(portfolioPaths);
    }

    const { error } = await supabase.rpc('admin_delete_client', { p_client_id: profile.id });
    setErasing(false);
    if (error) {
      setFlagStatus('Wissen mislukt. Probeer opnieuw of contacteer de ontwikkelaar.');
      return;
    }
    onDeleted();
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

      <section aria-labelledby="flags-heading" className={`${CARD_CLASS} space-y-5`}>
        <h2 id="flags-heading" className={SECTION_LABEL}>
          No-shows & fototoestemming
        </h2>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-primary">No-shows</p>
            <p className="text-xs text-primary/60">
              Telt automatisch mee als je een afspraak op &quot;No-show&quot; zet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="No-show eraf"
              onClick={() => void changeNoShows(-1)}
              disabled={noShows === 0}
              className={`h-12 w-12 rounded-full border border-taupe/50 text-lg disabled:opacity-40 ${FOCUS_RING}`}
            >
              −
            </button>
            <span
              className={`min-w-10 text-center font-serif text-2xl ${noShows > 0 ? 'text-red-800' : 'text-primary'}`}
              aria-live="polite"
            >
              {noShows}
            </span>
            <button
              type="button"
              aria-label="No-show erbij"
              onClick={() => void changeNoShows(1)}
              className={`h-12 w-12 rounded-full border border-taupe/50 text-lg ${FOCUS_RING}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-taupe/30 pt-5">
          <div>
            <p className="font-medium text-primary">Fototoestemming</p>
            <p className="text-xs text-primary/60">
              Foto&apos;s van het resultaat mogen in het portfolio en op Instagram.
              {profile.photo_consent_at && photoConsent
                ? ` Sinds ${new Date(profile.photo_consent_at).toLocaleDateString('nl-BE')}.`
                : ''}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={photoConsent}
            aria-label="Fototoestemming"
            onClick={() => void toggleConsent()}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${FOCUS_RING} ${
              photoConsent ? 'bg-accent' : 'bg-taupe/60'
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                photoConsent ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {flagStatus && (
          <p role="status" className="text-sm text-primary/80">
            {flagStatus}
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

      <section aria-labelledby="erase-heading" className="space-y-3 rounded-[1.75rem] border border-red-200 p-5">
        <h2 id="erase-heading" className={SECTION_LABEL}>
          Alle gegevens wissen
        </h2>
        <p className="text-sm leading-relaxed text-primary/75">
          Wist het account, alle afspraken, geüploade foto&apos;s en gekoppelde portfoliofoto&apos;s
          van {profile.full_name}. Dit kan niet ongedaan gemaakt worden. Gebruik dit als een klant
          vraagt om vergeten te worden (AVG).
        </p>
        {confirmErase ? (
          <div className="space-y-3">
            <label className="block text-sm text-primary/80">
              Typ WISSEN om te bevestigen
              <input
                value={eraseText}
                onChange={(event) => setEraseText(event.target.value)}
                autoComplete="off"
                className={`mt-2 ${INPUT_CLASS}`}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={eraseText.trim().toUpperCase() !== 'WISSEN' || erasing}
                onClick={() => void eraseClient()}
                className={`${BUTTON_PRIMARY} flex-1 bg-red-800 hover:bg-red-900 disabled:opacity-50`}
              >
                {erasing ? 'Bezig met wissen…' : 'Definitief wissen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmErase(false);
                  setEraseText('');
                }}
                className={BUTTON_SECONDARY}
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmErase(true)}
            className={`${BUTTON_SECONDARY} w-full text-red-800`}
          >
            Gegevens van deze klant wissen
          </button>
        )}
      </section>
    </div>
  );
}