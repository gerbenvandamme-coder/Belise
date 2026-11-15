'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/schedule';
import { formatDate, formatTime } from '@/lib/admin/format';
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD_CLASS,
  FOCUS_RING,
  INPUT_CLASS,
  SECTION_LABEL,
} from '@/lib/admin/ui';
import type { DateOverrideRow } from '@/lib/database.types';

// Maandag eerst. Waarden volgen Date.getDay(): 0 = zondag.
const WEEK_ORDER: { dayOfWeek: number; name: string }[] = [
  { dayOfWeek: 1, name: 'Maandag' },
  { dayOfWeek: 2, name: 'Dinsdag' },
  { dayOfWeek: 3, name: 'Woensdag' },
  { dayOfWeek: 4, name: 'Donderdag' },
  { dayOfWeek: 5, name: 'Vrijdag' },
  { dayOfWeek: 6, name: 'Zaterdag' },
  { dayOfWeek: 0, name: 'Zondag' },
];

// Zelfde standaardwaarden als de tabel weekly_availability.
const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

type WeeklyDay = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type OverrideForm = {
  date: string;
  open: boolean;
  start: string;
  end: string;
  note: string;
};

function defaultDay(dayOfWeek: number): WeeklyDay {
  return {
    day_of_week: dayOfWeek,
    start_time: DEFAULT_START,
    end_time: DEFAULT_END,
    is_active: false,
  };
}

function isValidWindow(start: string, end: string): boolean {
  return Boolean(start && end) && start.slice(0, 5) < end.slice(0, 5);
}

function dayName(dayOfWeek: number): string {
  return WEEK_ORDER.find((day) => day.dayOfWeek === dayOfWeek)?.name ?? 'Onbekende dag';
}

export default function AvailabilityTab() {
  const [weekly, setWeekly] = useState<Record<number, WeeklyDay>>({});
  const [overrides, setOverrides] = useState<DateOverrideRow[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<OverrideForm>(() => ({
    date: toDateKey(new Date()),
    open: false,
    start: '09:00',
    end: '16:00',
    note: '',
  }));

  const loadAll = useCallback(async () => {
    const today = toDateKey(new Date());
    const [weeklyResult, overrideResult] = await Promise.all([
      supabase.from('weekly_availability').select('*'),
      supabase
        .from('date_overrides')
        .select('*')
        .gte('specific_date', today)
        .order('specific_date', { ascending: true }),
    ]);

    if (weeklyResult.error || overrideResult.error) {
      setMessage('Beschikbaarheid laden mislukt.');
      return;
    }

    const byDay: Record<number, WeeklyDay> = {};
    for (const row of weeklyResult.data ?? []) {
      byDay[row.day_of_week] = row;
    }
    setWeekly(byDay);
    setOverrides(overrideResult.data ?? []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveDay(day: WeeklyDay) {
    if (!isValidWindow(day.start_time, day.end_time)) {
      setMessage(`Begintijd moet vóór de eindtijd liggen (${dayName(day.day_of_week)}).`);
      return;
    }

    const { error } = await supabase
      .from('weekly_availability')
      .upsert(day, { onConflict: 'day_of_week' });

    if (error) {
      setMessage('Opslaan mislukt. Probeer opnieuw.');
      return;
    }
    setMessage(null);
  }

  function changeDay(dayOfWeek: number, patch: Partial<WeeklyDay>, persist: boolean) {
    const next = { ...(weekly[dayOfWeek] ?? defaultDay(dayOfWeek)), ...patch };
    setWeekly((previous) => ({ ...previous, [dayOfWeek]: next }));
    if (persist) {
      void saveDay(next);
    }
  }

  async function addOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.date) {
      setMessage('Kies eerst een datum.');
      return;
    }
    if (form.open && !isValidWindow(form.start, form.end)) {
      setMessage('Begintijd moet vóór de eindtijd liggen.');
      return;
    }

    const { error } = await supabase.from('date_overrides').upsert(
      {
        specific_date: form.date,
        is_available: form.open,
        start_time: form.open ? form.start : null,
        end_time: form.open ? form.end : null,
        note: form.note.trim() || null,
      },
      { onConflict: 'specific_date' },
    );

    if (error) {
      setMessage('Uitzondering opslaan mislukt. Probeer opnieuw.');
      return;
    }
    setMessage(null);
    setForm((previous) => ({ ...previous, note: '' }));
    await loadAll();
  }

  async function removeOverride(id: string) {
    const { error } = await supabase.from('date_overrides').delete().eq('id', id);
    if (error) {
      setMessage('Verwijderen mislukt. Probeer opnieuw.');
      return;
    }
    await loadAll();
  }

  return (
    <div className="space-y-10">
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}

      <section aria-labelledby="weekly-heading" className="space-y-3">
        <h2 id="weekly-heading" className={SECTION_LABEL}>
          Vaste weekdagen
        </h2>
        <ul className="space-y-3">
          {WEEK_ORDER.map(({ dayOfWeek, name }) => {
            const day = weekly[dayOfWeek] ?? defaultDay(dayOfWeek);
            return (
              <li key={dayOfWeek} className={`${CARD_CLASS} space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-primary">{name}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={day.is_active}
                    aria-label={`${name} boekbaar`}
                    onClick={() => changeDay(dayOfWeek, { is_active: !day.is_active }, true)}
                    className={`relative inline-flex h-12 w-20 shrink-0 items-center rounded-full p-1 transition-colors motion-reduce:transition-none ${
                      day.is_active ? 'bg-accent' : 'bg-taupe/60'
                    } ${FOCUS_RING}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-10 w-10 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                        day.is_active ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-primary/80">
                    Begin
                    <input
                      type="time"
                      value={day.start_time.slice(0, 5)}
                      disabled={!day.is_active}
                      onChange={(event) =>
                        changeDay(dayOfWeek, { start_time: event.target.value }, false)
                      }
                      onBlur={() => saveDay(day)}
                      className={`mt-2 ${INPUT_CLASS}`}
                    />
                  </label>
                  <label className="text-sm text-primary/80">
                    Einde
                    <input
                      type="time"
                      value={day.end_time.slice(0, 5)}
                      disabled={!day.is_active}
                      onChange={(event) =>
                        changeDay(dayOfWeek, { end_time: event.target.value }, false)
                      }
                      onBlur={() => saveDay(day)}
                      className={`mt-2 ${INPUT_CLASS}`}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="override-heading" className="space-y-4">
        <h2 id="override-heading" className={SECTION_LABEL}>
          Losse dagen
        </h2>

        <form onSubmit={addOverride} className={`${CARD_CLASS} space-y-4`}>
          <label className="block text-sm text-primary/80">
            Datum
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, date: event.target.value }))
              }
              className={`mt-2 ${INPUT_CLASS}`}
            />
          </label>

          <div role="group" aria-label="Soort uitzondering" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={!form.open}
              onClick={() => setForm((previous) => ({ ...previous, open: false }))}
              className={`${BUTTON_SECONDARY} ${!form.open ? '!bg-accent !text-white' : ''}`}
            >
              Sluiten / verlof
            </button>
            <button
              type="button"
              aria-pressed={form.open}
              onClick={() => setForm((previous) => ({ ...previous, open: true }))}
              className={`${BUTTON_SECONDARY} ${form.open ? '!bg-accent !text-white' : ''}`}
            >
              Extra openzetten
            </button>
          </div>

          {form.open && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-primary/80">
                Begin
                <input
                  type="time"
                  required
                  value={form.start}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, start: event.target.value }))
                  }
                  className={`mt-2 ${INPUT_CLASS}`}
                />
              </label>
              <label className="text-sm text-primary/80">
                Einde
                <input
                  type="time"
                  required
                  value={form.end}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, end: event.target.value }))
                  }
                  className={`mt-2 ${INPUT_CLASS}`}
                />
              </label>
            </div>
          )}

          <label className="block text-sm text-primary/80">
            Notitie (optioneel)
            <input
              type="text"
              maxLength={120}
              value={form.note}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, note: event.target.value }))
              }
              className={`mt-2 ${INPUT_CLASS}`}
            />
          </label>

          <button type="submit" className={`${BUTTON_PRIMARY} w-full`}>
            Uitzondering toevoegen
          </button>
        </form>

        {overrides === null && <p className="text-sm text-primary/70">Uitzonderingen laden…</p>}
        {overrides !== null && overrides.length === 0 && (
          <p className="text-sm text-primary/70">Geen geplande uitzonderingen.</p>
        )}
        <ul className="space-y-3">
          {(overrides ?? []).map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-taupe/40 bg-card px-4 py-3"
            >
              <div className="text-sm text-primary">
                <p className="font-medium">{formatDate(row.specific_date)}</p>
                <p className="text-primary/70">
                  {row.is_available && row.start_time && row.end_time
                    ? `Open ${formatTime(row.start_time)} – ${formatTime(row.end_time)}`
                    : 'Gesloten'}
                  {row.note ? ` · ${row.note}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeOverride(row.id)}
                aria-label={`Verwijder uitzondering voor ${formatDate(row.specific_date)}`}
                className={`inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full text-primary/70 hover:bg-canvas ${FOCUS_RING}`}
              >
                <Trash2 aria-hidden="true" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}