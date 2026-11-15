'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CARD_CLASS, FOCUS_RING, SECTION_LABEL } from '@/lib/admin/ui';
import {
  OWNER_LABEL,
  TODO_GROUPS,
  TODO_SETTING_KEY,
  type TodoItem,
  type TodoOwner,
} from '@/lib/admin/todos';

type Filter = 'open' | TodoOwner | 'alles';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'eigenares', label: 'Voor mij' },
  { id: 'ontwikkelaar', label: 'Ontwikkelaar' },
  { id: 'samen', label: 'Samen' },
  { id: 'alles', label: 'Alles' },
];

const PRIORITY: Record<TodoItem['priority'], { label: string; className: string }> = {
  1: { label: 'Eerst', className: 'bg-accent-soft text-accent-dark' },
  2: { label: 'Belangrijk', className: 'bg-blush/60 text-primary/80' },
  3: { label: 'Later', className: 'bg-canvas text-primary/60 ring-1 ring-taupe/40' },
};

function TodoRow({
  item,
  done,
  busy,
  onToggle,
}: {
  item: TodoItem;
  done: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-t border-taupe/30 first:border-t-0">
      <div className="flex items-start gap-3 py-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${item.title} ${done ? 'als open markeren' : 'afvinken'}`}
          disabled={busy}
          onClick={onToggle}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${FOCUS_RING} ${
            done ? 'border-accent bg-accent text-white' : 'border-taupe/70 bg-card hover:border-accent'
          }`}
        >
          {done && <Check size={15} aria-hidden="true" />}
        </button>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl text-left ${FOCUS_RING}`}
        >
          <span className="min-w-0">
            <span className={`block text-[15px] font-medium ${done ? 'text-primary/45 line-through' : 'text-primary'}`}>
              {item.title}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY[item.priority].className}`}>
                {PRIORITY[item.priority].label}
              </span>
              <span className="rounded-full border border-taupe/50 px-2 py-0.5 text-[11px] text-primary/70">
                {OWNER_LABEL[item.owner]}
              </span>
              {item.where && (
                <span className="rounded-full px-2 py-0.5 text-[11px] text-primary/55">{item.where}</span>
              )}
            </span>
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`mt-1 shrink-0 text-primary/50 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div className="mb-4 ml-10 rounded-2xl bg-canvas px-4 py-3 text-sm leading-relaxed text-primary/80">
          <p className="text-primary/70">{item.why}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            {item.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}

/** To-dolijst voor de livegang en de inhoud. Afgevinkte taken worden bewaard in site_settings. */
export default function TodoTab() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('open');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', TODO_SETTING_KEY)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Afgevinkte taken laden mislukt.');
          return;
        }
        try {
          const ids: unknown = data?.value ? JSON.parse(data.value) : [];
          if (Array.isArray(ids)) setDone(new Set(ids.filter((id): id is string => typeof id === 'string')));
        } catch {
          setDone(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(id: string) {
    const previous = done;
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDone(next);
    setBusyId(id);
    setError(null);
    const { error: saveError } = await supabase
      .from('site_settings')
      .upsert({ key: TODO_SETTING_KEY, value: JSON.stringify([...next]) }, { onConflict: 'key' });
    setBusyId(null);
    if (saveError) {
      setDone(previous);
      setError('Opslaan mislukt. Probeer opnieuw.');
    }
  }

  const all = useMemo(() => TODO_GROUPS.flatMap((group) => group.items), []);
  const total = all.length;
  const doneCount = all.filter((item) => done.has(item.id)).length;
  const mineOpen = all.filter((item) => item.owner !== 'ontwikkelaar' && !done.has(item.id)).length;

  const visible = (item: TodoItem) => {
    if (filter === 'alles') return true;
    if (filter === 'open') return !done.has(item.id);
    return item.owner === filter;
  };

  return (
    <div className="space-y-8">
      <div className={`${CARD_CLASS} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="font-serif text-3xl text-primary">
            {doneCount} <span className="text-primary/40">/ {total}</span>
          </p>
          <p className="text-sm text-primary/65">
            taken afgerond · {mineOpen} open voor jou of samen
          </p>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-canvas ring-1 ring-taupe/30">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter taken">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
            className={`min-h-10 rounded-full px-4 text-sm transition-colors ${FOCUS_RING} ${
              filter === option.id ? 'bg-primary text-canvas' : 'border border-taupe/50 text-primary/75 hover:bg-canvas'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {TODO_GROUPS.map((group) => {
        const items = group.items.filter(visible);
        if (items.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`todo-${group.id}`} className="space-y-3">
            <h2 id={`todo-${group.id}`} className={SECTION_LABEL}>
              {group.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-primary/65">{group.intro}</p>
            <ul className={CARD_CLASS}>
              {items.map((item) => (
                <TodoRow
                  key={item.id}
                  item={item}
                  done={done.has(item.id)}
                  busy={busyId === item.id}
                  onToggle={() => void toggle(item.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {TODO_GROUPS.every((group) => group.items.filter(visible).length === 0) && (
        <p className="text-sm text-primary/70">Niets meer open in deze selectie.</p>
      )}
    </div>
  );
}
