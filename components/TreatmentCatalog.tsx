'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, ChevronUp, Clock, Info, Plus, Repeat2, X } from 'lucide-react';
import { ITEM_NOTE, infoFor } from '@/lib/treatmentInfo';
import { conflictReason, conflictsWith, sanitizeSelection, toggleWithRules } from '@/lib/treatmentRules';
import {
  LENGTH_LABELS,
  LENGTH_OPTIONS,
  formatDurationRange,
  formatPrice,
  formatPriceRange,
  getDurationRange,
  getPriceEuro,
  getPriceRange,
  getProcessingDurationMin,
  getTotalDurationMin,
  hasLengthOptions,
  type TreatmentCategory,
  type TreatmentItem,
} from '@/lib/treatments';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const EASE = [0.22, 1, 0.36, 1] as const;

type Group = { label: string; items: TreatmentItem[] };
type Selected = { item: TreatmentItem; group: string; category: TreatmentCategory };

function groupsOf(category: TreatmentCategory): Group[] {
  const map = new Map<string, TreatmentItem[]>();
  for (const item of category.treatments) {
    const key = item.group ?? category.title;
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return Array.from(map, ([label, items]) => ({ label, items }));
}

function rangeOf(items: readonly TreatmentItem[]) {
  const prices = items.map(getPriceRange);
  return { min: Math.min(...prices.map((p) => p.min)), max: Math.max(...prices.map((p) => p.max)) };
}

function durationOf(items: readonly TreatmentItem[]) {
  const durations = items.map(getDurationRange);
  return { min: Math.min(...durations.map((d) => d.min)), max: Math.max(...durations.map((d) => d.max)) };
}

const bookingHref = (ids: readonly string[]) =>
  `/booking?item=${ids.map((id) => encodeURIComponent(id)).join(',')}`;

/* ---------------------------------------------------------- selectie ---- */

const STORAGE_KEY = 'belise-selectie';

type Selection = {
  ids: readonly string[];
  /** Korte melding wanneer een behandeling een andere verving. */
  notice: string | null;
  has: (id: string) => boolean;
  /** Gekozen behandelingen die met `id` botsen. */
  conflicts: (id: string) => string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
  const value = useContext(SelectionContext);
  if (!value) throw new Error('useSelection buiten TreatmentCatalog');
  return value;
}

/** Selectie van behandelingen, bewaard voor dit tabblad (sessionStorage) zodat terugkeren niets wist. */
function useSelectionState(byId: ReadonlyMap<string, TreatmentItem>): Selection {
  const [ids, setIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const loaded = useRef(false);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setIds(sanitizeSelection(parsed.filter((id): id is string => typeof id === 'string' && byId.has(id))));
      }
    } catch {
      // Geen opslag beschikbaar: selectie blijft enkel in het geheugen.
    }
    loaded.current = true;
  }, [byId]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Negeren: zie hierboven.
    }
  }, [ids]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4500);
  }, []);

  const toggle = useCallback(
    (id: string) => {
      const result = toggleWithRules(ids, id);
      setIds(result.next);
      if (result.replaced.length > 0) {
        const names = result.replaced.map((other) => byId.get(other)?.title ?? other).join(' en ');
        showNotice(`${names} vervangen door ${byId.get(id)?.title ?? id}. ${conflictReason(id, result.replaced[0]) ?? ''}`.trim());
      }
    },
    [ids, byId, showNotice],
  );

  return useMemo(
    () => ({
      ids,
      notice,
      has: (id: string) => ids.includes(id),
      conflicts: (id: string) => conflictsWith(id, ids),
      toggle,
      remove: (id: string) => setIds((current) => current.filter((other) => other !== id)),
      clear: () => setIds([]),
    }),
    [ids, notice, toggle],
  );
}

/** Toevoegen-knop die omslaat naar "Gekozen". */
function PickButton({ item, size = 'sm' }: { item: TreatmentItem; size?: 'sm' | 'lg' }) {
  const selection = useSelection();
  const picked = selection.has(item.id);
  const swap = !picked && selection.conflicts(item.id).length > 0;
  const large = size === 'lg';
  const Icon = picked ? Check : swap ? Repeat2 : Plus;
  const label = picked
    ? large
      ? 'Gekozen · tik om te verwijderen'
      : 'Gekozen'
    : swap
      ? large
        ? 'Wisselen naar deze behandeling'
        : 'Wisselen'
      : large
        ? 'Toevoegen aan je afspraak'
        : 'Toevoegen';
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={
        picked
          ? `${item.title} verwijderen uit je afspraak`
          : swap
            ? `Wisselen naar ${item.title}`
            : `${item.title} toevoegen aan je afspraak`
      }
      onClick={() => selection.toggle(item.id)}
      className={`ease-luxe inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-300 active:scale-95 motion-reduce:transition-none ${FOCUS} ${
        large ? 'h-12 flex-1 px-6 text-[14px]' : 'h-9 px-3.5 text-[12px]'
      } ${
        picked
          ? 'bg-accent-soft text-accent-dark ring-1 ring-accent/40'
          : swap
            ? 'bg-card text-accent-dark ring-1 ring-accent/50 hover:bg-accent-soft'
            : 'bg-accent text-white shadow-sm hover:bg-accent-dark'
      }`}
    >
      <Icon size={large ? 16 : 14} aria-hidden="true" />
      <span className={large ? '' : 'hidden sm:inline'}>{label}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- rij ---- */

function TreatmentRow({ item, onInfo }: { item: TreatmentItem; onInfo: () => void }) {
  const picked = useSelection().has(item.id);
  const price = getPriceRange(item);
  const duration = getDurationRange(item);
  const note = ITEM_NOTE[item.id];

  return (
    <li
      className={`group/row flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-300 sm:px-4 ${
        picked ? 'bg-accent-soft/50' : 'hover:bg-blush/35'
      }`}
    >
      <button
        type="button"
        onClick={onInfo}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left ${FOCUS}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-snug text-stone-900">{item.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-primary/55">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {formatDurationRange(duration.min, duration.max)}
            </span>
            {note && <span className="hidden truncate sm:inline">{note}</span>}
          </span>
        </span>
        <span className="shrink-0 font-serif text-lg tabular-nums text-primary">
          {formatPriceRange(price.min, price.max)}
        </span>
        <span
          aria-hidden="true"
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-taupe/50 text-primary/60 transition-colors group-hover/row:border-accent/40 group-hover/row:text-accent-dark sm:flex"
        >
          <Info size={14} />
        </span>
        <span className="sr-only">Meer info over {item.title}</span>
      </button>
      <PickButton item={item} />
    </li>
  );
}

/* ------------------------------------------------------------- groep ---- */

function GroupPanel({
  group,
  open,
  onToggle,
  onInfo,
  single,
}: {
  group: Group;
  open: boolean;
  onToggle: () => void;
  onInfo: (item: TreatmentItem) => void;
  single: boolean;
}) {
  const panelId = useId();
  const range = rangeOf(group.items);
  const info = infoFor(group.label);
  const isOpen = single || open;

  return (
    <div
      className={`rounded-[1.5rem] transition-colors duration-500 ${
        isOpen ? 'bg-canvas/70 ring-1 ring-taupe/30' : 'bg-transparent'
      }`}
    >
      {!single && (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={`flex w-full items-center justify-between gap-4 rounded-[1.5rem] px-4 py-4 text-left transition-colors hover:bg-blush/30 sm:px-5 ${FOCUS}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-8 w-1 shrink-0 rounded-full transition-colors duration-500 ${isOpen ? 'bg-accent' : 'bg-taupe/50'}`}
            />
            <span className="min-w-0">
              <span className="block font-serif text-xl leading-tight text-stone-900">{group.label}</span>
              <span className="mt-0.5 block text-[12px] text-primary/55">
                {group.items.length} behandeling{group.items.length === 1 ? '' : 'en'} ·{' '}
                {formatPriceRange(range.min, range.max)}
              </span>
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`ease-luxe flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500 motion-reduce:transition-none ${
              isOpen ? 'rotate-180 border-accent/30 bg-accent-soft text-accent-dark' : 'border-taupe/50 text-primary/70'
            }`}
          >
            <ChevronDown size={16} />
          </span>
        </button>
      )}

      <div
        id={panelId}
        role="region"
        aria-label={group.label}
        className={`ease-luxe grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-1 pb-3 sm:px-2" inert={!isOpen}>
            {info && (
              <p className="mx-3 mb-2 max-w-2xl text-[13px] leading-relaxed text-primary/65 sm:mx-4">
                {info.description}
              </p>
            )}
            <ul className="divide-y divide-taupe/20">
              {group.items.map((item) => (
                <TreatmentRow key={item.id} item={item} onInfo={() => onInfo(item)} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- categorie ---- */

function CategoryCard({
  category,
  index,
  open,
  onToggle,
  onInfo,
}: {
  category: TreatmentCategory;
  index: number;
  open: boolean;
  onToggle: () => void;
  onInfo: (item: TreatmentItem, group: string) => void;
}) {
  const groups = groupsOf(category);
  const single = groups.length === 1;
  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.label ?? null);
  const headingId = useId();
  const panelId = useId();
  const range = rangeOf(category.treatments);
  const duration = durationOf(category.treatments);

  return (
    <article
      id={category.id}
      aria-labelledby={headingId}
      className={`reveal ease-luxe scroll-mt-28 overflow-hidden rounded-[2rem] bg-card ring-1 transition-[box-shadow] duration-500 ${
        open ? 'shadow-luxe-lg ring-accent/20' : 'shadow-luxe ring-taupe/25 hover:shadow-luxe-lg'
      }`}
    >
      <div className="group relative flex w-full flex-col text-left md:flex-row">
        {/* Onzichtbare knop over de hele kop: zo blijft de titel een echte kop (h2). */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${category.title}: behandelingen ${open ? 'verbergen' : 'tonen'}`}
          onClick={onToggle}
          className={`absolute inset-0 z-10 rounded-t-[2rem] ${FOCUS} focus-visible:-outline-offset-4`}
        />
        {/* Foto: zet uit wanneer de categorie opent. */}
        <span
          className={`ease-luxe relative block w-full shrink-0 overflow-hidden transition-[height,flex-basis] duration-700 motion-reduce:transition-none [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] md:[mask-image:linear-gradient(to_right,#000_45%,rgba(0,0,0,0.55)_72%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)] md:[-webkit-mask-image:linear-gradient(to_right,#000_45%,rgba(0,0,0,0.55)_72%,transparent)] ${
            open ? 'h-60 md:h-80 md:basis-[52%]' : 'h-44 md:h-60 md:basis-[42%]'
          }`}
        >
          {category.image ? (
            <Image
              src={category.image}
              alt={`${category.title} bij Belise in Opwijk`}
              fill
              priority={index < 2}
              sizes="(min-width: 768px) 46vw, 100vw"
              className={`ease-luxe object-cover transition-transform duration-1000 motion-reduce:transition-none ${
                open ? 'scale-100' : 'scale-[1.06] group-hover:scale-[1.03]'
              }`}
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-[#EBCFD4] via-[#F2E3DC] to-[#EEE2D2]" />
          )}
          <span className="absolute left-4 top-4 rounded-full bg-gradient-to-br from-[#7A4652] to-[#A46F79] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-canvas shadow-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
        </span>

        <span className="relative -mt-10 flex min-w-0 flex-1 flex-col justify-between gap-5 p-6 sm:p-8 md:-ml-14 md:mt-0">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl transition-opacity duration-700 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <span className="relative flex items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-dark">
                {category.subtitle}
              </span>
              <h2
                id={headingId}
                className="mt-2 font-serif text-4xl leading-none tracking-[-0.02em] text-stone-900 sm:text-5xl"
              >
                {category.title}
              </h2>
            </span>
            <span
              aria-hidden="true"
              className={`ease-luxe flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-500 motion-reduce:transition-none ${
                open
                  ? 'rotate-180 border-accent bg-accent text-white'
                  : 'border-taupe/50 text-primary group-hover:border-accent/40 group-hover:text-accent-dark'
              }`}
            >
              <ChevronDown size={18} />
            </span>
          </span>

          <span className="relative block">
            <span className="flex flex-wrap gap-1.5">
              {groups.map((group) => (
                <span
                  key={group.label}
                  className="rounded-full border border-taupe/50 bg-white/50 px-3 py-1 text-[12px] text-primary/75"
                >
                  {group.label}
                </span>
              ))}
            </span>
            <span className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2">
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-primary/50">Vanaf</span>
                <span className="font-serif text-2xl leading-none text-primary">{formatPrice(range.min)}</span>
              </span>
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-primary/50">Duur</span>
                <span className="text-[14px] text-primary/75">{formatDurationRange(duration.min, duration.max)}</span>
              </span>
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-primary/50">Aanbod</span>
                <span className="text-[14px] text-primary/75">{category.treatments.length} behandelingen</span>
              </span>
            </span>
          </span>
        </span>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={`Behandelingen ${category.title}`}
        className={`ease-luxe grid transition-[grid-template-rows,opacity] duration-700 motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-taupe/25 p-4 sm:p-6 lg:p-8" inert={!open}>
            <div className="space-y-2">
              {groups.map((group) => (
                <GroupPanel
                  key={group.label}
                  group={group}
                  single={single}
                  open={openGroup === group.label}
                  onToggle={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                  onInfo={(item) => onInfo(item, group.label)}
                />
              ))}
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-[1.5rem] bg-gradient-to-r from-[#F6E5E8] to-[#FAF1EC] px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-[13px] text-primary/70">
                Tik op een behandeling voor meer info. Met &quot;Toevoegen&quot; stel je je afspraak samen,
                ook over categorieën heen.
              </p>
              <FooterCta categoryId={category.id} title={category.title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FooterCta({ categoryId, title }: { categoryId: string; title: string }) {
  const { ids } = useSelection();
  const href = ids.length > 0 ? bookingHref(ids) : `/booking?category=${categoryId}`;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-canvas transition-colors hover:bg-accent ${FOCUS}`}
    >
      {ids.length > 0 ? 'Verder naar datum' : `Boek ${title.toLowerCase()}`}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

/* ------------------------------------------------------- zwevende balk ---- */

function SelectionBar({ byId }: { byId: ReadonlyMap<string, TreatmentItem> }) {
  const selection = useSelection();
  const [expanded, setExpanded] = useState(false);
  const items = selection.ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });

  useEffect(() => {
    if (items.length === 0) setExpanded(false);
  }, [items.length]);

  const price = items.reduce(
    (sum, item) => {
      const range = getPriceRange(item);
      return { min: sum.min + range.min, max: sum.max + range.max };
    },
    { min: 0, max: 0 },
  );
  const duration = items.reduce(
    (sum, item) => {
      const range = getDurationRange(item);
      return { min: sum.min + range.min, max: sum.max + range.max };
    },
    { min: 0, max: 0 },
  );

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          key="bar"
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 sm:bottom-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#7A4652] via-[#8E5763] to-[#A46F79] text-canvas shadow-luxe-lg ring-1 ring-white/15">
            <AnimatePresence initial={false}>
              {selection.notice && (
                <motion.p
                  key={selection.notice}
                  role="status"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex items-start gap-2 border-b border-white/15 bg-black/10 px-5 py-3 text-[13px] leading-snug text-canvas/95"
                >
                  <Repeat2 size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {selection.notice}
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.ul
                  key="list"
                  id="selection-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="max-h-[45vh] overflow-y-auto border-b border-white/15 px-3 pt-3"
                >
                  {items.map((item) => {
                    const range = getPriceRange(item);
                    return (
                      <li key={item.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/10">
                        <span className="min-w-0 flex-1 truncate text-[14px]">{item.title}</span>
                        <span className="shrink-0 text-[13px] tabular-nums text-canvas/80">
                          {formatPriceRange(range.min, range.max)}
                        </span>
                        <button
                          type="button"
                          onClick={() => selection.remove(item.id)}
                          aria-label={`${item.title} verwijderen`}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-canvas/80 transition-colors hover:bg-white/15 hover:text-canvas ${FOCUS}`}
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                  <li className="flex justify-end px-2 pb-2 pt-1">
                    <button
                      type="button"
                      onClick={selection.clear}
                      className={`rounded-full px-3 py-1 text-[12px] text-canvas/70 underline-offset-4 hover:text-canvas hover:underline ${FOCUS}`}
                    >
                      Alles wissen
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 p-2 pl-3">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="selection-list"
                onClick={() => setExpanded((value) => !value)}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] px-2 py-1.5 text-left transition-colors hover:bg-white/10 ${FOCUS}`}
              >
                <motion.span
                  key={items.length}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 font-serif text-lg text-accent-dark"
                >
                  {items.length}
                </motion.span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-canvas/75">
                    Jouw afspraak
                  </span>
                  <span className="block truncate text-[14px]">
                    {formatPriceRange(price.min, price.max)} · {formatDurationRange(duration.min, duration.max)}
                  </span>
                </span>
                <ChevronUp
                  size={16}
                  aria-hidden="true"
                  className={`ml-auto shrink-0 text-canvas/70 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
                />
              </button>
              <Link
                href={bookingHref(selection.ids)}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-canvas px-4 text-[13px] font-medium text-accent-dark shadow-sm transition-colors hover:bg-white sm:px-5 ${FOCUS}`}
              >
                <span className="hidden sm:inline">Verder naar datum</span>
                <span className="sm:hidden">Verder</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------- infovenster ---- */

function InfoDialog({ selected, onClose }: { selected: Selected | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [selected, onClose]);

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#2b1a14]/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-card shadow-luxe-lg ring-1 ring-taupe/30 sm:rounded-[2rem]"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(event) => event.stopPropagation()}
          >
            <DialogBody selected={selected} titleId={titleId} closeRef={closeRef} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DialogBody({
  selected,
  titleId,
  closeRef,
  onClose,
}: {
  selected: Selected;
  titleId: string;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { item, group, category } = selected;
  const info = infoFor(group);
  const note = ITEM_NOTE[item.id];
  const perLength = hasLengthOptions(item);
  const price = getPriceRange(item);
  const processing = getProcessingDurationMin(item, perLength ? 'medium' : null);

  return (
    <>
      <div className="relative h-36 overflow-hidden rounded-t-[2rem] sm:h-40">
        {category.image ? (
          <Image src={category.image} alt="" fill sizes="32rem" className="object-cover" />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-[#7A4652] to-[#A46F79]" />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm backdrop-blur transition-colors hover:bg-card ${FOCUS}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="-mt-6 px-6 pb-6 sm:px-8 sm:pb-8">
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-dark">
          {category.title}
          {group !== category.title ? ` · ${group}` : ''}
        </p>
        <h3 id={titleId} className="relative mt-2 font-serif text-3xl leading-tight text-stone-900">
          {item.title}
        </h3>
        {note && <p className="mt-2 text-[15px] leading-relaxed text-primary/75">{note}</p>}

        {perLength ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {LENGTH_OPTIONS.map((length) => (
              <div key={length} className="rounded-2xl bg-canvas px-3 py-3 text-center ring-1 ring-taupe/30">
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary/55">{LENGTH_LABELS[length]}</p>
                <p className="mt-1 font-serif text-xl text-stone-900">{formatPrice(getPriceEuro(item, length))}</p>
                <p className="text-[11px] text-primary/55">{getTotalDurationMin(item, length)} min</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-6 rounded-2xl bg-canvas px-5 py-4 ring-1 ring-taupe/30">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-primary/55">Prijs</p>
              <p className="font-serif text-2xl text-stone-900">{formatPriceRange(price.min, price.max)}</p>
            </div>
            <span aria-hidden="true" className="h-10 w-px bg-taupe/40" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-primary/55">Duur</p>
              <p className="text-[15px] text-primary">{getTotalDurationMin(item)} min</p>
            </div>
          </div>
        )}
        {processing > 0 && (
          <p className="mt-2 text-[12px] text-primary/55">Inclusief inwerktijd van ongeveer {processing} minuten.</p>
        )}

        {info && (
          <div className="mt-6">
            <p className="text-[14px] leading-relaxed text-primary/75">{info.description}</p>
            {info.tips && info.tips.length > 0 && (
              <ul className="mt-4 space-y-2">
                {info.tips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-[13px] leading-relaxed text-primary/70">
                    <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ConflictHint item={item} />

        <p className="mt-5 text-[11px] leading-relaxed text-primary/45">
          Richtprijs. De definitieve prijs hangt af van lengte, design en een eventuele oude set.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <PickButton item={item} size="lg" />
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-full border border-primary/20 px-6 py-3 text-[14px] font-medium text-primary transition-colors hover:bg-blush/50 ${FOCUS}`}
          >
            Terug
          </button>
        </div>
      </div>
    </>
  );
}

function ConflictHint({ item }: { item: TreatmentItem }) {
  const selection = useSelection();
  const others = selection.has(item.id) ? [] : selection.conflicts(item.id);
  if (others.length === 0) return null;
  return (
    <p className="mt-5 flex items-start gap-2 rounded-2xl bg-accent-soft/60 px-4 py-3 text-[13px] leading-relaxed text-accent-dark">
      <Repeat2 size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>
        Kan niet samen met wat je al koos. Kies je deze, dan vervangt ze die behandeling.{' '}
        {conflictReason(item.id, others[0])}
      </span>
    </p>
  );
}

/* --------------------------------------------------------------- lijst ---- */

export default function TreatmentCatalog({ categories }: { categories: readonly TreatmentCategory[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const byId = useMemo(
    () => new Map(categories.flatMap((category) => category.treatments.map((item) => [item.id, item] as const))),
    [categories],
  );
  const selection = useSelectionState(byId);
  const [selected, setSelected] = useState<Selected | null>(null);
  const close = useCallback(() => setSelected(null), []);

  // Link met #nails, #waxing ... opent die categorie meteen.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && categories.some((category) => category.id === hash)) setOpenId(hash);
  }, [categories]);

  return (
    <SelectionContext.Provider value={selection}>
      <nav aria-label="Categorieën" className="mt-10 flex flex-wrap gap-2">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            onClick={() => setOpenId(category.id)}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${FOCUS} ${
              openId === category.id
                ? 'bg-gradient-to-br from-[#7A4652] to-[#A46F79] text-canvas shadow-sm'
                : 'border border-taupe/50 bg-card/70 text-primary/75 hover:border-accent/40 hover:text-accent-dark'
            }`}
          >
            {category.title}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-5">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            open={openId === category.id}
            onToggle={() => setOpenId((current) => (current === category.id ? null : category.id))}
            onInfo={(item, group) => setSelected({ item, group, category })}
          />
        ))}
      </div>

      {/* Ruimte zodat de zwevende balk de laatste kaart niet bedekt. */}
      {selection.ids.length > 0 && <div aria-hidden="true" className="h-24" />}

      <SelectionBar byId={byId} />
      <InfoDialog selected={selected} onClose={close} />
    </SelectionContext.Provider>
  );
}
