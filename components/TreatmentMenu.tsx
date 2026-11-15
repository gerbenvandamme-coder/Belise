'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import {
  formatDurationRange,
  formatPrice,
  formatPriceRange,
  getDurationRange,
  getPriceRange,
  type TreatmentCategory,
  type TreatmentItem,
} from '@/lib/treatments';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type Group = { label: string; items: TreatmentItem[] };

function groupTreatments(category: TreatmentCategory): Group[] {
  const groups = new Map<string, TreatmentItem[]>();
  for (const treatment of category.treatments) {
    // Behandelingen zonder subgroep (bv. ontharing) komen samen onder de categorienaam.
    const key = treatment.group ?? 'Alle behandelingen';
    groups.set(key, [...(groups.get(key) ?? []), treatment]);
  }
  return Array.from(groups, ([label, items]) => ({ label, items }));
}

function rangeOf(items: readonly TreatmentItem[]) {
  const prices = items.map(getPriceRange);
  return {
    min: Math.min(...prices.map((price) => price.min)),
    max: Math.max(...prices.map((price) => price.max)),
  };
}

function TreatmentRow({ treatment }: { treatment: TreatmentItem }) {
  const price = getPriceRange(treatment);
  const duration = getDurationRange(treatment);

  return (
    <li>
      <Link
        href={`/booking?item=${encodeURIComponent(treatment.id)}`}
        className={`group/row flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-blush/40 ${FOCUS_RING}`}
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-medium leading-snug text-primary">
            {treatment.title}
          </span>
          <span className="block text-[11px] text-primary/55">
            {formatDurationRange(duration.min, duration.max)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[13px] font-medium tabular-nums text-primary">
          {formatPriceRange(price.min, price.max)}
          <ArrowRight
            size={13}
            aria-hidden="true"
            className="-translate-x-1 text-accent opacity-0 transition duration-300 group-hover/row:translate-x-0 group-hover/row:opacity-100 motion-reduce:transition-none"
          />
        </span>
      </Link>
    </li>
  );
}

/** Uitklapbare groep. De hoogte animeert via grid-rows (0fr -> 1fr): vloeiend, zonder metingen in JS. */
function GroupAccordion({
  group,
  open,
  onToggle,
}: {
  group: Group;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const range = rangeOf(group.items);

  return (
    <div className="border-t border-taupe/25 first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-1 py-3 text-left ${FOCUS_RING}`}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-dark">
            {group.label}
          </span>
          <span className="mt-0.5 block text-[11px] text-primary/55">
            {group.items.length} behandeling{group.items.length === 1 ? '' : 'en'} ·{' '}
            {formatPriceRange(range.min, range.max)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`ease-luxe flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-taupe/50 transition-[transform,background-color] duration-500 motion-reduce:transition-none ${
            open ? 'rotate-180 bg-blush/50' : ''
          }`}
        >
          <ChevronDown size={14} className="text-primary/70" />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={group.label}
        className={`ease-luxe grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="pb-3" inert={!open}>
            {group.items.map((treatment) => (
              <TreatmentRow key={treatment.id} treatment={treatment} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TreatmentCard({
  category,
  index,
  eager,
}: {
  category: TreatmentCategory;
  index: number;
  eager: boolean;
}) {
  const groups = groupTreatments(category);
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const headingId = useId();
  const startingPrice = rangeOf(category.treatments).min;

  return (
    <article
      aria-labelledby={headingId}
      className="reveal shadow-luxe ease-luxe group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-taupe/25 transition-[transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:shadow-luxe-lg motion-reduce:hover:translate-y-0"
    >
      {category.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={category.image}
            alt={`${category.title} bij Belise in Opwijk`}
            fill
            priority={eager}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
            className="ease-luxe object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card"
          />
          <span className="absolute left-4 top-4 rounded-full bg-card/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-primary/70 backdrop-blur">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <div className="flex items-end justify-between gap-3">
          <h3
            id={headingId}
            className="font-serif text-2xl font-semibold leading-tight tracking-[-0.01em] text-stone-900"
          >
            {category.title}
          </h3>
          <p className="shrink-0 text-right">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-primary/50">
              Vanaf
            </span>
            <span className="font-serif text-xl leading-none text-primary">
              {formatPrice(startingPrice)}
            </span>
          </p>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-primary/60">{category.subtitle}</p>

        <div aria-hidden="true" className="hairline my-3 h-px" />

        <div className="flex-1">
          {groups.map((group) => (
            <GroupAccordion
              key={group.label}
              group={group}
              open={openLabel === group.label}
              onToggle={() =>
                setOpenLabel((current) => (current === group.label ? null : group.label))
              }
            />
          ))}
        </div>

        <Link
          href={`/booking?category=${category.id}`}
          className={`mt-4 inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-canvas transition-colors duration-300 hover:bg-accent ${FOCUS_RING}`}
        >
          Boek {category.title.toLowerCase()}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function TreatmentMenu({
  categories,
  eager = false,
}: {
  categories: readonly TreatmentCategory[];
  /** Foto's meteen laden (wanneer de kaarten bovenaan de pagina staan). */
  eager?: boolean;
}) {
  return (
    <div
      className={`mt-10 grid items-start gap-5 md:grid-cols-2 ${
        categories.length >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'
      }`}
    >
      {categories.map((category, index) => (
        <TreatmentCard key={category.id} category={category} index={index} eager={eager} />
      ))}
    </div>
  );
}
