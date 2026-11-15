'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BUTTON_PRIMARY,
  CARD_CLASS,
  FOCUS_RING,
  INPUT_CLASS,
  SECTION_LABEL,
} from '@/lib/admin/ui';
import {
  LENGTH_LABELS,
  LENGTH_OPTIONS,
  TREATMENT_CATEGORIES,
  type LengthOption,
  type TreatmentCategoryId,
} from '@/lib/treatments';
import type { ServiceRow } from '@/lib/database.types';

type LengthPricing = Record<
  LengthOption,
  { price_euro: number; active_duration_min: number; processing_duration_min: number }
>;

const FIXED_KEY = 'fixed';

function readLengthPricing(value: ServiceRow['length_pricing']): LengthPricing | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as unknown as LengthPricing;
}

function buildLengthPricing(
  current: LengthPricing,
  prices: Record<string, number>,
): LengthPricing {
  const next = {} as LengthPricing;
  for (const length of LENGTH_OPTIONS) {
    next[length] = { ...current[length], price_euro: prices[length] };
  }
  return next;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SettingsTab() {
  const [services, setServices] = useState<ServiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('services')
      .select('*')
      .order('category_id', { ascending: true })
      .order('sort_order', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Behandelingen laden mislukt.');
          return;
        }
        setError(null);
        setServices(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = () => setReloadToken((token) => token + 1);
  const nextSortOrder =
    Math.max(0, ...(services ?? []).map((service) => service.sort_order)) + 1;

  return (
    <div className="space-y-12">
      <section aria-labelledby="services-heading" className="space-y-8">
        <h2 id="services-heading" className={SECTION_LABEL}>
          Diensten & prijzen
        </h2>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {services === null && !error && (
          <p className="text-sm text-primary/70">Behandelingen laden…</p>
        )}

        {services !== null &&
          TREATMENT_CATEGORIES.map((category) => {
            const rows = services.filter((service) => service.category_id === category.id);
            return (
              <div key={category.id} className="space-y-3">
                <h3 className="font-serif text-xl font-normal text-primary">{category.title}</h3>
                <ul className="space-y-3">
                  {rows.map((service) => (
                    <ServiceEditor
                      key={service.id}
                      service={service}
                      onChanged={reload}
                      onError={setError}
                    />
                  ))}
                </ul>
              </div>
            );
          })}

        {services !== null && (
          <NewServiceForm nextSortOrder={nextSortOrder} onCreated={reload} onError={setError} />
        )}
      </section>

      <AnnouncementSection />
    </div>
  );
}

type ServiceEditorProps = {
  service: ServiceRow;
  onChanged: () => void;
  onError: (message: string) => void;
};

function ServiceEditor({ service, onChanged, onError }: ServiceEditorProps) {
  const pricing = readLengthPricing(service.length_pricing);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    pricing
      ? Object.fromEntries(
          LENGTH_OPTIONS.map((length) => [length, String(pricing[length].price_euro)]),
        )
      : { [FIXED_KEY]: String(service.price_euro ?? '') },
  );
  const [saving, setSaving] = useState(false);

  async function savePrices() {
    const parsed: Record<string, number> = {};
    for (const [key, raw] of Object.entries(prices)) {
      const value = Number(raw);
      if (!raw.trim() || !Number.isInteger(value) || value < 0) {
        onError(`Vul bij ${service.title} een geheel bedrag van 0 euro of meer in.`);
        return;
      }
      parsed[key] = value;
    }

    const update = pricing
      ? { length_pricing: buildLengthPricing(pricing, parsed) }
      : { price_euro: parsed[FIXED_KEY] };

    setSaving(true);
    const { error } = await supabase.from('services').update(update).eq('id', service.id);
    setSaving(false);

    if (error) {
      onError('Prijs opslaan mislukt. Probeer opnieuw.');
      return;
    }
    onChanged();
  }

  async function toggleVisible() {
    setSaving(true);
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);
    setSaving(false);

    if (error) {
      onError('Zichtbaarheid wijzigen mislukt. Probeer opnieuw.');
      return;
    }
    onChanged();
  }

  return (
    <li className={`${CARD_CLASS} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-primary">{service.title}</p>
          {service.group_name && (
            <p className="text-xs text-primary/60">{service.group_name}</p>
          )}
        </div>
        <button
          type="button"
          aria-pressed={service.is_active}
          disabled={saving}
          onClick={toggleVisible}
          className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-medium disabled:opacity-50 ${
            service.is_active ? 'bg-accent-soft text-accent-dark' : 'bg-taupe/30 text-primary'
          } ${FOCUS_RING}`}
        >
          {service.is_active ? 'Zichtbaar' : 'Verborgen'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.keys(prices).map((key) => (
          <label key={key} className="text-sm text-primary/80">
            {key === FIXED_KEY ? 'Prijs (€)' : `${LENGTH_LABELS[key as LengthOption]} (€)`}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={prices[key]}
              onChange={(event) =>
                setPrices((previous) => ({ ...previous, [key]: event.target.value }))
              }
              className={`mt-2 ${INPUT_CLASS}`}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={savePrices}
        className={`${BUTTON_PRIMARY} w-full`}
      >
        Prijs opslaan
      </button>
    </li>
  );
}

type NewServiceFormProps = {
  nextSortOrder: number;
  onCreated: () => void;
  onError: (message: string) => void;
};

function NewServiceForm({ nextSortOrder, onCreated, onError }: NewServiceFormProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<TreatmentCategoryId>('nails');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const priceValue = Number(price);
    const durationValue = Number(duration);

    if (!cleanTitle) {
      onError('Geef de behandeling een naam.');
      return;
    }
    if (
      !Number.isInteger(priceValue) ||
      priceValue < 0 ||
      !Number.isInteger(durationValue) ||
      durationValue <= 0
    ) {
      onError('Vul een geheel bedrag en een actieve duur in minuten in.');
      return;
    }
    const id = slugify(cleanTitle);
    if (!id) {
      onError('De naam bevat geen letters of cijfers.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('services').insert({
      id,
      category_id: categoryId,
      title: cleanTitle,
      price_euro: priceValue,
      active_duration_min: durationValue,
      processing_duration_min: 0,
      sort_order: nextSortOrder,
    });
    setSaving(false);

    if (error) {
      onError(
        error.code === '23505'
          ? 'Er bestaat al een behandeling met die naam.'
          : 'Behandeling toevoegen mislukt.',
      );
      return;
    }

    setTitle('');
    setPrice('');
    setDuration('');
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className={`${CARD_CLASS} space-y-4`}>
      <h3 className="font-serif text-xl font-normal text-primary">Nieuwe behandeling</h3>

      <label className="block text-sm text-primary/80">
        Naam
        <input
          type="text"
          required
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={`mt-2 ${INPUT_CLASS}`}
        />
      </label>

      <label className="block text-sm text-primary/80">
        Categorie
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value as TreatmentCategoryId)}
          className={`mt-2 ${INPUT_CLASS}`}
        >
          {TREATMENT_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-primary/80">
          Prijs (€)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>
        <label className="text-sm text-primary/80">
          Actieve duur (minuten)
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>
      </div>

      <button type="submit" disabled={saving} className={`${BUTTON_PRIMARY} w-full`}>
        {saving ? 'Toevoegen…' : 'Behandeling toevoegen'}
      </button>
    </form>
  );
}

function AnnouncementSection() {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('site_settings')
      .select('*')
      .in('key', ['announcement_enabled', 'announcement_text'])
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus('Instellingen laden mislukt.');
          return;
        }
        for (const row of data ?? []) {
          if (row.key === 'announcement_enabled') setEnabled(row.value === 'true');
          if (row.key === 'announcement_text') setText(row.value);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (enabled && !cleanText) {
      setStatus('Vul een tekst in om de banner te tonen.');
      return;
    }

    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from('site_settings').upsert(
      [
        { key: 'announcement_enabled', value: String(enabled) },
        { key: 'announcement_text', value: cleanText },
      ],
      { onConflict: 'key' },
    );
    setSaving(false);

    setStatus(error ? 'Opslaan mislukt. Probeer opnieuw.' : 'Banner opgeslagen.');
  }

  return (
    <section aria-labelledby="announcement-heading" className="space-y-4">
      <h2 id="announcement-heading" className={SECTION_LABEL}>
        Mededelingsbanner
      </h2>

      <form onSubmit={handleSave} className={`${CARD_CLASS} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-primary">Banner tonen op de website</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Banner tonen op de website"
            onClick={() => setEnabled((previous) => !previous)}
            className={`relative inline-flex h-12 w-20 shrink-0 items-center rounded-full p-1 transition-colors motion-reduce:transition-none ${
              enabled ? 'bg-accent' : 'bg-taupe/60'
            } ${FOCUS_RING}`}
          >
            <span
              aria-hidden="true"
              className={`h-10 w-10 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                enabled ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <label className="block text-sm text-primary/80">
          Tekst (max. 160 tekens)
          <input
            type="text"
            maxLength={160}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Bijvoorbeeld: Zomerverlof van 1 tot 15 augustus"
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        {status && (
          <p role="status" className="text-sm text-primary/80">
            {status}
          </p>
        )}

        <button type="submit" disabled={saving} className={`${BUTTON_PRIMARY} w-full`}>
          {saving ? 'Opslaan…' : 'Banner opslaan'}
        </button>
      </form>
    </section>
  );
}