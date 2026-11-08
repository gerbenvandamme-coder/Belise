'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Clock, X } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';
import TimeSlotPicker, { type Reservation } from '@/components/TimeSlotPicker';
import { toDateKey } from '@/lib/schedule';
import {
  TREATMENT_CATEGORIES,
  formatPrice,
  type TreatmentCategoryId,
  type TreatmentItem,
} from '@/lib/treatments';

type BookableTreatment = TreatmentItem & {
  categoryId: TreatmentCategoryId;
};

// Maximale lengte van het veld "service" in lib/bookings/validation.ts.
const MAX_SERVICE_LABEL_LENGTH = 100;
const SERVICE_LABEL_SEPARATOR = ' + ';
const DEFAULT_CATEGORY_ID: TreatmentCategoryId = 'nails';

const BOOKABLE_TREATMENTS: readonly BookableTreatment[] = TREATMENT_CATEGORIES.flatMap(
  (category) =>
    category.treatments.map((treatment) => ({
      ...treatment,
      categoryId: category.id,
    })),
);

const BOOKABLE_BY_ID = new Map<string, BookableTreatment>(
  BOOKABLE_TREATMENTS.map((treatment): [string, BookableTreatment] => [treatment.id, treatment]),
);

// Bestaande afspraken staan op de server. De API weigert een bezet tijdslot met status 409.
const NO_RESERVATIONS: readonly Reservation[] = [];

type FormValues = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

const EMPTY_FORM: FormValues = { clientName: '', clientEmail: '', clientPhone: '' };
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
  const item = itemParam ? BOOKABLE_BY_ID.get(itemParam) : undefined;
  if (item) return { categoryId: item.categoryId, treatmentIds: [item.id] };
  if (isTreatmentCategoryId(categoryParam)) return { categoryId: categoryParam, treatmentIds: [] };
  return { categoryId: DEFAULT_CATEGORY_ID, treatmentIds: [] };
}

function readErrorMessage(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'string'
  ) {
    return data.error;
  }
  return FALLBACK_ERROR;
}

function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

type BookingSummaryProps = {
  selected: readonly BookableTreatment[];
  totalDurationMinutes: number;
  totalPriceEuro: number;
  serviceTooLong: boolean;
  onRemove: (id: string) => void;
  onNext: () => void;
};

function BookingSummary({
  selected,
  totalDurationMinutes,
  totalPriceEuro,
  serviceTooLong,
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
              <span className="min-w-0 truncate">{treatment.title}</span>
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
          disabled={!hasSelection || serviceTooLong}
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
    </aside>
  );
}

function BookingFlow() {
  const searchParams = useSearchParams();
  const [initial] = useState(() =>
    getInitialSelection(searchParams.get('category'), searchParams.get('item')),
  );

  const [activeCategoryId, setActiveCategoryId] = useState<TreatmentCategoryId>(
    initial.categoryId,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.treatmentIds);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const activeCategory = TREATMENT_CATEGORIES.find((category) => category.id === activeCategoryId);

  const selectedTreatments = selectedIds
    .map((id) => BOOKABLE_BY_ID.get(id))
    .filter((treatment): treatment is BookableTreatment => treatment !== undefined);
  const hasSelection = selectedTreatments.length > 0;
  const totalDurationMinutes = selectedTreatments.reduce(
    (sum, treatment) => sum + treatment.durationMinutes,
    0,
  );
  const totalPriceEuro = selectedTreatments.reduce((sum, treatment) => sum + treatment.priceEuro, 0);
  const serviceLabel = selectedTreatments
    .map((treatment) => treatment.title)
    .join(SERVICE_LABEL_SEPARATOR);
  const serviceTooLong = serviceLabel.length > MAX_SERVICE_LABEL_LENGTH;
  const canSubmit = hasSelection && !serviceTooLong && date !== null && time !== null && !submitting;

  // Elke wijziging in de selectie verandert de duur, dus het gekozen tijdslot vervalt.
  const toggleTreatment = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
    setTime(null);
  };

  const selectDate = (next: Date) => {
    setDate(next);
    setTime(null);
  };

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !time || !hasSelection || serviceTooLong) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          service: serviceLabel,
          duration: totalDurationMinutes,
          date: toDateKey(date),
          startTime: time,
          design: null,
        }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        // Bij 409 is het tijdslot weg, dus de klant kiest opnieuw een tijd.
        if (response.status === 409) setTime(null);
        setError(readErrorMessage(data));
        return;
      }

      setConfirmationEmail(form.clientEmail);
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
          Bijna klaar
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-primary/70">
          We stuurden een bevestigingsmail naar {confirmationEmail}. Klik binnen 15 minuten op de
          link in die mail om je afspraak definitief te maken. Lukt dat niet, dan komt het tijdslot
          weer vrij.
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
              {TREATMENT_CATEGORIES.map((category) => {
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
                return (
                  <button
                    key={treatment.id}
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
                        {treatment.description}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 text-xs ${
                          selected ? 'text-white/85' : 'text-primary/60'
                        }`}
                      >
                        <Clock size={12} aria-hidden="true" />
                        {treatment.durationMinutes} min
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-serif text-lg">{formatPrice(treatment.priceEuro)}</span>
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
                );
              })}
            </div>
          </section>

          <section id="step-date" aria-labelledby="step-date-heading" className="scroll-mt-28">
            <h2 id="step-date-heading" className={SECTION_HEADING}>
              2. Dag
            </h2>
            <div className="mt-4">
              <BookingCalendar selectedDate={date} onSelectDate={selectDate} />
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
                  reservations={NO_RESERVATIONS}
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
              4. Je gegevens
            </h2>

            <label className="block text-sm font-medium text-primary">
              Naam
              <input
                name="clientName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={form.clientName}
                onChange={(event) => updateField('clientName', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>

            <label className="block text-sm font-medium text-primary">
              E-mailadres
              <input
                name="clientEmail"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={form.clientEmail}
                onChange={(event) => updateField('clientEmail', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>

            <label className="block text-sm font-medium text-primary">
              Telefoonnummer
              <input
                name="clientPhone"
                type="tel"
                required
                minLength={6}
                maxLength={20}
                autoComplete="tel"
                value={form.clientPhone}
                onChange={(event) => updateField('clientPhone', event.target.value)}
                className={INPUT_CLASS}
              />
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
              {submitting ? 'Bezig met reserveren...' : 'Afspraak bevestigen'}
            </button>

            <p className="text-xs leading-relaxed text-primary/60">
              Na het reserveren krijg je een e-mail om je afspraak te bevestigen. Het tijdslot wordt
              15 minuten vastgehouden.
            </p>
          </section>
        </div>

        <BookingSummary
          selected={selectedTreatments}
          totalDurationMinutes={totalDurationMinutes}
          totalPriceEuro={totalPriceEuro}
          serviceTooLong={serviceTooLong}
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