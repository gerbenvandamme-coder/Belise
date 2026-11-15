'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Clock, X } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';
import PhotoDropzone from '@/components/PhotoDropzone';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { clearPendingBooking, loadPendingBooking, savePendingBooking } from '@/lib/pendingBooking';
import { toDateKey } from '@/lib/schedule';
import { supabase } from '@/lib/supabase';
import { uploadBookingReference } from '@/lib/supabaseStorage';
import { useTreatmentCategories } from '@/lib/useTreatmentCategories';
import { loadOpenDays, NO_OPEN_DAYS, type OpenDays } from '@/lib/whitelist';
import {
  LENGTH_LABELS,
  LENGTH_OPTIONS,
  TREATMENT_CATEGORIES,
  formatDurationRange,
  formatPrice,
  formatPriceRange,
  getDurationRange,
  getPriceEuro,
  getPriceRange,
  getTotalDurationMin,
  hasLengthOptions,
  type LengthOption,
  type TreatmentCategory,
  type TreatmentCategoryId,
  type TreatmentItem,
} from '@/lib/treatments';

type BookableTreatment = TreatmentItem & {
  categoryId: TreatmentCategoryId;
};

/** Een gekozen behandeling met de prijs en duur die bij de gekozen lengte horen. */
type PricedTreatment = {
  id: string;
  title: string;
  length: LengthOption | null;
  lengthRequired: boolean;
  priceEuro: number;
  durationMinutes: number;
};

function getTreatmentLabel(treatment: PricedTreatment): string {
  return treatment.length
    ? `${treatment.title} (${LENGTH_LABELS[treatment.length]})`
    : treatment.title;
}

// Zonder lengtekeuze tonen we het bereik, met lengtekeuze de exacte waarde.
function getRowPrice(treatment: TreatmentItem, length: LengthOption | null): string {
  if (hasLengthOptions(treatment) && length === null) {
    const { min, max } = getPriceRange(treatment);
    return formatPriceRange(min, max);
  }
  return formatPrice(getPriceEuro(treatment, length));
}

function getRowDuration(treatment: TreatmentItem, length: LengthOption | null): string {
  if (hasLengthOptions(treatment) && length === null) {
    const { min, max } = getDurationRange(treatment);
    return formatDurationRange(min, max);
  }
  return formatDurationRange(
    getTotalDurationMin(treatment, length),
    getTotalDurationMin(treatment, length),
  );
}

// Maximale lengte van de samengestelde behandelingsnaam.
const MAX_SERVICE_LABEL_LENGTH = 100;
const SERVICE_LABEL_SEPARATOR = ' + ';
const DEFAULT_CATEGORY_ID: TreatmentCategoryId = 'nails';

/** Index van alle boekbare behandelingen op id, voor de vaste of de geladen prijslijst. */
function buildBookableIndex(
  categories: readonly TreatmentCategory[],
): Map<string, BookableTreatment> {
  return new Map(
    categories.flatMap((category) =>
      category.treatments.map((treatment): [string, BookableTreatment] => [
        treatment.id,
        { ...treatment, categoryId: category.id },
      ]),
    ),
  );
}

// Enkel voor de beginkeuze uit de URL. De ids in de vaste lijst en in public.services zijn gelijk.
const STATIC_BOOKABLE_BY_ID = buildBookableIndex(TREATMENT_CATEGORIES);

type FormValues = {
  clientNotes: string;
  /** Toestemming om foto's van het resultaat op Instagram te delen. Standaard uit. */
  photoSocialConsent: boolean;
};

const EMPTY_FORM: FormValues = { clientNotes: '', photoSocialConsent: false };
const FALLBACK_ERROR = 'Er ging iets mis. Probeer het later opnieuw.';

const SECTION_HEADING = 'font-serif text-2xl font-light text-primary';
const INPUT_CLASS =
  'mt-2 w-full rounded-2xl border border-taupe/50 bg-canvas px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function isTreatmentCategoryId(value: string | null): value is TreatmentCategoryId {
  return TREATMENT_CATEGORIES.some((category) => category.id === value);
}

type InitialSelection = {
  categoryId: TreatmentCategoryId;
  treatmentIds: string[];
};

// Een item in de URL heeft voorrang en bepaalt ook de categorie. Onbekende waarden vallen terug op de standaard.
function getInitialSelection(
  categoryParam: string | null,
  itemParam: string | null,
): InitialSelection {
  const item = itemParam ? STATIC_BOOKABLE_BY_ID.get(itemParam) : undefined;
  if (item) return { categoryId: item.categoryId, treatmentIds: [item.id] };
  if (isTreatmentCategoryId(categoryParam)) return { categoryId: categoryParam, treatmentIds: [] };
  return { categoryId: DEFAULT_CATEGORY_ID, treatmentIds: [] };
}

const SLOT_UNAVAILABLE_CODE = 'SLOT_UNAVAILABLE';
const SLOT_UNAVAILABLE_MESSAGE = 'Dit tijdslot is net bezet. Kies een andere tijd.';

/** Vertaalt een fout van de create_booking RPC naar een melding voor de klant. */
function readBookingError(error: { message: string; code?: string }): {
  message: string;
  slotLost: boolean;
} {
  if (error.message.includes(SLOT_UNAVAILABLE_CODE)) {
    return { message: SLOT_UNAVAILABLE_MESSAGE, slotLost: true };
  }
  if (error.code === '42501') {
    return { message: 'Je sessie is verlopen. Log opnieuw in om te boeken.', slotLost: false };
  }
  // De functie gooit bij ongeldige invoer (22023) een Nederlandse melding.
  if ((error.code === '22023' || error.code === 'P0001') && error.message) {
    return { message: error.message, slotLost: false };
  }
  return { message: FALLBACK_ERROR, slotLost: false };
}

function isLengthOption(value: string): value is LengthOption {
  return Object.prototype.hasOwnProperty.call(LENGTH_LABELS, value);
}

/** 'YYYY-MM-DD' naar een lokale datum, of null bij een ongeldige waarde. */
function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Telt minuten op bij 'HH:MM'. Geeft null als de eindtijd niet meer op dezelfde dag valt. */
function addMinutesToTime(time: string, minutes: number): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  if (total >= 24 * 60) return null;
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const mins = String(total % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

type BookingSummaryProps = {
  selected: readonly PricedTreatment[];
  totalDurationMinutes: number;
  totalPriceEuro: number;
  serviceTooLong: boolean;
  lengthMissing: boolean;
  onRemove: (id: string) => void;
  onNext: () => void;
};

function BookingSummary({
  selected,
  totalDurationMinutes,
  totalPriceEuro,
  serviceTooLong,
  lengthMissing,
  onRemove,
  onNext,
}: BookingSummaryProps) {
  const hasSelection = selected.length > 0;

  return (
    <aside
      aria-labelledby="booking-summary-heading"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-taupe/40 bg-card/95 px-6 py-4 shadow-[0_-12px_30px_-18px_rgba(28,25,23,0.35)] backdrop-blur lg:sticky lg:top-24 lg:z-auto lg:rounded-3xl lg:border lg:p-6 lg:shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)]"
    >
      <h2
        id="booking-summary-heading"
        className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark"
      >
        Samenvatting
      </h2>

      {hasSelection ? (
        <ul className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto lg:max-h-none lg:flex-col lg:flex-nowrap lg:overflow-visible">
          {selected.map((treatment) => (
            <li
              key={treatment.id}
              className="flex items-center justify-between gap-2 rounded-full bg-accent-soft py-1.5 pl-3 pr-1.5 text-xs text-primary lg:rounded-xl lg:bg-canvas lg:py-2 lg:pl-3 lg:pr-2 lg:text-sm"
            >
              <span className="min-w-0 truncate">{getTreatmentLabel(treatment)}</span>
              <button
                type="button"
                onClick={() => onRemove(treatment.id)}
                aria-label={`${treatment.title} verwijderen`}
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-accent-soft hover:text-accent-dark ${FOCUS_RING}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-primary/60">Nog geen behandeling gekozen.</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 lg:mt-5 lg:flex-col lg:items-stretch">
        <dl className="flex gap-4 text-sm lg:flex-col lg:gap-2">
          <div className="flex items-baseline gap-2">
            <dt className="text-primary/60">Duur</dt>
            <dd className="font-medium text-primary">{totalDurationMinutes} min</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-primary/60">Totaal</dt>
            <dd className="font-serif text-lg text-primary">{formatPrice(totalPriceEuro)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasSelection || serviceTooLong || lengthMissing}
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-accent/40 motion-reduce:transition-none ${FOCUS_RING}`}
        >
          Tijdslot kiezen
        </button>
      </div>

      {serviceTooLong && (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-red-700">
          Deze combinatie is te lang voor één afspraak. Verwijder een behandeling.
        </p>
      )}

      {lengthMissing && (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-red-700">
          Kies een haarlengte (Kort, Midden of Lang) voor elke haarbehandeling.
        </p>
      )}
    </aside>
  );
}

function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, loaded: categoriesLoaded } = useTreatmentCategories();
  const bookableById = useMemo(() => buildBookableIndex(categories), [categories]);
  const [initial] = useState(() =>
    getInitialSelection(searchParams.get('category'), searchParams.get('item')),
  );

  const [activeCategoryId, setActiveCategoryId] = useState<TreatmentCategoryId>(
    initial.categoryId,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.treatmentIds);
  const [lengthById, setLengthById] = useState<Partial<Record<string, LengthOption>>>({});
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [openDays, setOpenDays] = useState<OpenDays>(NO_OPEN_DAYS);
  const [openDaysError, setOpenDaysError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOpenDays(toDateKey(new Date()))
      .then((days) => {
        if (!cancelled) setOpenDays(days);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setOpenDaysError(error instanceof Error ? error.message : FALLBACK_ERROR);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [nowPhoto, setNowPhoto] = useState<File | null>(null);
  const [inspirationPhoto, setInspirationPhoto] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setUserId(authSession?.user.id ?? null);
      setUserEmail(authSession?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Na de magic link komt de klant terug met ?resume=1. Dan zetten we de bewaarde keuze terug.
  const resumeRequested = searchParams.get('resume') === '1';
  useEffect(() => {
    // Wacht op de actuele tarieven, zodat een bewaarde keuze niet wegvalt.
    if (!resumeRequested || !categoriesLoaded) return;
    const pending = loadPendingBooking();
    if (!pending) return;

    const ids = pending.selectedIds.filter((id) => bookableById.has(id));
    const lengths: Partial<Record<string, LengthOption>> = {};
    for (const [id, length] of Object.entries(pending.lengthById)) {
      if (bookableById.has(id) && isLengthOption(length)) lengths[id] = length;
    }
    const firstTreatment = ids[0] ? bookableById.get(ids[0]) : undefined;

    setSelectedIds(ids);
    setLengthById(lengths);
    if (firstTreatment) setActiveCategoryId(firstTreatment.categoryId);
    setDate(parseDateKey(pending.dateKey));
    setTime(pending.time);
    setForm({
      clientNotes: pending.clientNotes,
      photoSocialConsent: pending.photoSocialConsent,
    });
    setResumed(true);
  }, [resumeRequested, categoriesLoaded, bookableById]);

  const activeCategory = categories.find((category) => category.id === activeCategoryId);

  const selectedTreatments: PricedTreatment[] = selectedIds.flatMap((id) => {
    const treatment = bookableById.get(id);
    if (!treatment) return [];
    const lengthRequired = hasLengthOptions(treatment);
    const length = lengthRequired ? (lengthById[id] ?? null) : null;
    return [
      {
        id,
        title: treatment.title,
        length,
        lengthRequired,
        priceEuro: getPriceEuro(treatment, length),
        durationMinutes: getTotalDurationMin(treatment, length),
      },
    ];
  });
  const hasSelection = selectedTreatments.length > 0;
  const lengthMissing = selectedTreatments.some(
    (treatment) => treatment.lengthRequired && treatment.length === null,
  );
  const totalDurationMinutes = selectedTreatments.reduce(
    (sum, treatment) => sum + treatment.durationMinutes,
    0,
  );
  const totalPriceEuro = selectedTreatments.reduce((sum, treatment) => sum + treatment.priceEuro, 0);
  const serviceLabel = selectedTreatments.map(getTreatmentLabel).join(SERVICE_LABEL_SEPARATOR);
  const serviceTooLong = serviceLabel.length > MAX_SERVICE_LABEL_LENGTH;
  const canSubmit =
    hasSelection &&
    !lengthMissing &&
    !serviceTooLong &&
    date !== null &&
    time !== null &&
    authChecked &&
    !submitting;

  // Elke wijziging in de selectie verandert de duur, dus het gekozen tijdslot vervalt.
  const toggleTreatment = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
    setTime(null);
  };

  // De lengte bepaalt prijs en duur, dus het gekozen tijdslot vervalt ook hier.
  const selectLength = (id: string, length: LengthOption) => {
    setLengthById((previous) => ({ ...previous, [id]: length }));
    setTime(null);
  };

  const selectDate = (next: Date) => {
    setDate(next);
    setTime(null);
  };

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !time || !hasSelection || lengthMissing || serviceTooLong) return;

    // Zonder sessie bewaren we de keuze en loggen we eerst in via een magic link.
    if (!userId) {
      const lengths: Record<string, string> = {};
      for (const [id, length] of Object.entries(lengthById)) {
        if (length) lengths[id] = length;
      }
      savePendingBooking({
        selectedIds,
        lengthById: lengths,
        dateKey: toDateKey(date),
        time,
        clientNotes: form.clientNotes,
        photoSocialConsent: form.photoSocialConsent,
      });
      router.push(`/account?next=${encodeURIComponent('/booking?resume=1')}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUserId(null);
        setUserEmail(null);
        setError('Je sessie is verlopen. Log opnieuw in om te boeken.');
        return;
      }
      const user = userData.user;

      const endTime = addMinutesToTime(time, totalDurationMinutes);
      if (!endTime) {
        setError('Dit tijdslot past niet binnen één dag. Kies een andere tijd.');
        return;
      }

      // Elke poging krijgt een nieuw id, zodat een eerdere upload (upsert: false) niets blokkeert.
      const bookingId = crypto.randomUUID();

      let referenceNowPath: string | null;
      let inspirationPath: string | null;
      try {
        [referenceNowPath, inspirationPath] = await Promise.all([
          nowPhoto
            ? uploadBookingReference({ userId: user.id, bookingId, kind: 'now', file: nowPhoto })
            : Promise.resolve(null),
          inspirationPhoto
            ? uploadBookingReference({
                userId: user.id,
                bookingId,
                kind: 'inspiration',
                file: inspirationPhoto,
              })
            : Promise.resolve(null),
        ]);
      } catch (uploadError: unknown) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'Upload mislukt. Probeer het opnieuw.',
        );
        return;
      }

      const { error: rpcError } = await supabase.rpc('create_booking', {
        p_booking_id: bookingId,
        p_booking_date: toDateKey(date),
        p_start_time: time,
        p_end_time: endTime,
        p_treatments: selectedTreatments.map((treatment) => ({
          id: treatment.id,
          title: treatment.title,
          label: getTreatmentLabel(treatment),
          length: treatment.length,
          price_euro: treatment.priceEuro,
          duration_min: treatment.durationMinutes,
        })),
        p_total_price: totalPriceEuro,
        p_client_notes: form.clientNotes.trim() || null,
        p_reference_now_path: referenceNowPath,
        p_inspiration_path: inspirationPath,
        p_photo_social_consent: form.photoSocialConsent,
      });

      if (rpcError) {
        const { message, slotLost } = readBookingError(rpcError);
        // Is het tijdslot weg, dan kiest de klant opnieuw een tijd.
        if (slotLost) setTime(null);
        setError(message);
        return;
      }

      clearPendingBooking();
      setConfirmationEmail(user.email ?? 'je account');
    } catch {
      setError('Geen verbinding met de server. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white">
          <Check size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-8 font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
          Afspraak aangevraagd
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-primary/70">
          We hebben je aanvraag ontvangen voor {confirmationEmail}. Je afspraak staat op "in
          afwachting". Je vindt hem terug onder Mijn afspraken in je account.
        </p>
        <Link
          href="/"
          className={`mt-10 inline-flex items-center gap-2 rounded-full border border-primary/25 px-6 py-3 text-sm font-medium text-primary transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-dark ${FOCUS_RING}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Terug naar home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 pb-56 lg:py-24 lg:pb-24">
      <Link
        href="/"
        className={`inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary/70 transition-colors hover:text-accent-dark ${FOCUS_RING}`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Terug naar home
      </Link>

      <header className="mt-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          Afspraak maken
        </p>
        <h1 className="mt-4 font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
          Boek je behandeling
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16"
      >
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="step-service">
            <h2 id="step-service" className={SECTION_HEADING}>
              1. Behandelingen
            </h2>

            <div
              role="tablist"
              aria-label="Categorieën"
              className="mt-4 flex gap-2 overflow-x-auto pb-1"
            >
              {categories.map((category) => {
                const active = category.id === activeCategoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    id={`tab-${category.id}`}
                    aria-selected={active}
                    aria-controls="treatment-panel"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                      active
                        ? 'border-accent bg-accent text-white'
                        : 'border-taupe/50 bg-card text-primary hover:border-accent hover:text-accent-dark'
                    }`}
                  >
                    {category.title}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id="treatment-panel"
              aria-labelledby={`tab-${activeCategoryId}`}
              className="mt-4 grid gap-3"
            >
              {activeCategory?.treatments.map((treatment) => {
                const selected = selectedIds.includes(treatment.id);
                const chosenLength = lengthById[treatment.id] ?? null;
                return (
                  <div key={treatment.id} className="grid gap-2">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTreatment(treatment.id)}
                    className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors duration-200 motion-reduce:transition-none active:scale-[0.99] ${FOCUS_RING} ${
                      selected
                        ? 'border-accent bg-accent text-white'
                        : 'border-taupe/50 bg-card text-primary hover:border-accent hover:bg-accent-soft'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{treatment.title}</span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          selected ? 'text-white/80' : 'text-primary/65'
                        }`}
                      >
                        {treatment.group}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 text-xs ${
                          selected ? 'text-white/85' : 'text-primary/60'
                        }`}
                      >
                        <Clock size={12} aria-hidden="true" />
                        {getRowDuration(treatment, chosenLength)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-serif text-lg">{getRowPrice(treatment, chosenLength)}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-white bg-white text-accent'
                            : 'border-taupe/60 text-transparent'
                        }`}
                      >
                        <Check size={14} />
                      </span>
                    </span>
                  </button>
                  {selected && hasLengthOptions(treatment) && (
                    <div
                      role="radiogroup"
                      aria-label={`Haarlengte voor ${treatment.title}`}
                      className="grid grid-cols-3 gap-2 rounded-2xl border border-accent/40 bg-accent-soft p-2"
                    >
                      {LENGTH_OPTIONS.map((option) => {
                        const chosen = chosenLength === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={chosen}
                            onClick={() => selectLength(treatment.id, option)}
                            className={`rounded-xl border px-3 py-2 text-center text-sm transition-colors duration-200 motion-reduce:transition-none active:scale-[0.98] ${FOCUS_RING} ${
                              chosen
                                ? 'border-accent bg-accent text-white'
                                : 'border-taupe/50 bg-card text-primary hover:border-accent'
                            }`}
                          >
                            <span className="block font-medium">{LENGTH_LABELS[option]}</span>
                            <span
                              className={`block text-xs ${chosen ? 'text-white/85' : 'text-primary/60'}`}
                            >
                              {formatPrice(getPriceEuro(treatment, option))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </section>

          <section id="step-date" aria-labelledby="step-date-heading" className="scroll-mt-28">
            <h2 id="step-date-heading" className={SECTION_HEADING}>
              2. Dag
            </h2>
            <div className="mt-4">
              <BookingCalendar
                selectedDate={date}
                onSelectDate={selectDate}
                openDays={openDays}
                loadError={openDaysError}
              />
            </div>
          </section>

          <section id="step-time" aria-labelledby="step-time-heading" className="scroll-mt-28">
            <h2 id="step-time-heading" className={SECTION_HEADING}>
              3. Tijd
            </h2>
            <div className="mt-4">
              {hasSelection ? (
                <TimeSlotPicker
                  date={date}
                  durationMinutes={totalDurationMinutes}
                  selectedTime={time}
                  onSelectTime={setTime}
                />
              ) : (
                <p className="text-sm text-primary/60">Kies eerst een behandeling.</p>
              )}
            </div>
          </section>

          <section aria-labelledby="step-details" className="space-y-6">
            <h2 id="step-details" className={SECTION_HEADING}>
              4. Afronden
            </h2>

            {authChecked && !userId && (
              <p className="text-sm leading-relaxed text-primary/70">
                Om te boeken log je in met een link in je mail, zonder wachtwoord. Je keuze blijft
                bewaard. Foto's voeg je toe nadat je bent ingelogd.
              </p>
            )}

            {resumed && userId && (
              <p role="status" className="text-sm leading-relaxed text-primary/70">
                Je keuze is teruggezet. Voeg eventueel je foto's toe en bevestig je afspraak.
              </p>
            )}

            {userId && userEmail && (
              <p className="text-sm text-primary/70">
                Je boekt als <span className="font-medium text-primary">{userEmail}</span>.
              </p>
            )}

            <label className="block text-sm font-medium text-primary">
              Opmerking (optioneel)
              <textarea
                name="clientNotes"
                rows={3}
                maxLength={500}
                value={form.clientNotes}
                onChange={(event) => updateField('clientNotes', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>

            {userId && (
              <>
                <PhotoDropzone
                  label="Huidige situatie (optioneel)"
                  hint="Een foto van je huidige haar, nagels of huid. JPG, PNG of WebP, max. 15 MB."
                  file={nowPhoto}
                  onChange={setNowPhoto}
                  disabled={submitting}
                />
                <PhotoDropzone
                  label="Inspiratie (optioneel)"
                  hint="Een voorbeeld van de look die je wilt. JPG, PNG of WebP, max. 15 MB."
                  file={inspirationPhoto}
                  onChange={setInspirationPhoto}
                  disabled={submitting}
                />
              </>
            )}

            <label className="flex items-start gap-3 text-sm leading-relaxed text-primary/80">
              <input
                name="photoSocialConsent"
                type="checkbox"
                checked={form.photoSocialConsent}
                onChange={(event) => updateField('photoSocialConsent', event.target.checked)}
                className={`mt-0.5 h-4 w-4 shrink-0 rounded border-taupe/60 accent-accent ${FOCUS_RING}`}
              />
              <span>
                Ik geef toestemming om foto's van het resultaat van mijn behandeling te delen op de
                Instagram van Belise. (optioneel, je kunt dit altijd intrekken)
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-accent/40 ${FOCUS_RING}`}
            >
              {submitting
                ? 'Bezig met reserveren...'
                : userId
                  ? 'Afspraak bevestigen'
                  : 'Inloggen om te boeken'}
            </button>

            <p className="text-xs leading-relaxed text-primary/60">
              Na het boeken staat je afspraak op "in afwachting". Je volgt hem onder Mijn afspraken
              in je account.
            </p>
          </section>
        </div>

        <BookingSummary
          selected={selectedTreatments}
          totalDurationMinutes={totalDurationMinutes}
          totalPriceEuro={totalPriceEuro}
          serviceTooLong={serviceTooLong}
          lengthMissing={lengthMissing}
          onRemove={toggleTreatment}
          onNext={() => scrollToSection('step-date')}
        />
      </form>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  );
}