'use client';

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import {
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PortfolioCategoryId } from '@/lib/database.types';
import { PORTFOLIO_CATEGORIES, type PortfolioEntry } from '@/lib/portfolio';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const POP = { type: 'spring', stiffness: 260, damping: 24, mass: 0.85 } as const;
const SETTLE = { type: 'spring', stiffness: 240, damping: 34, mass: 1 } as const;
const INSTANT = { duration: 0 } as const;
const DESKTOP_BREAKPOINT = 768;

function mod(value: number, n: number) {
  return ((value % n) + n) % n;
}

function shortestOffset(itemIndex: number, activeIndex: number, n: number) {
  let distance = mod(itemIndex - activeIndex, n);
  if (distance > n / 2) distance -= n;
  return distance;
}

/** Coverflow met kaders: de actieve foto vooraan, buren kleiner en vervaagd. */
function FramedCarousel({ items }: { items: readonly PortfolioEntry[] }) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const dragX = useMotionValue(0);
  const reduceMotion = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const desktop = width >= DESKTOP_BREAKPOINT;
  const step = width * (desktop ? 0.3 : 0.58);
  const goTo = (target: number) => setIndex(mod(target, n));
  const active = items[mod(index, n)];

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (step > 0) {
      const projected = info.offset.x + info.velocity.x * 0.15;
      const steps = Math.max(-3, Math.min(3, Math.round(-projected / step)));
      if (steps !== 0) setIndex((current) => mod(current + steps, n));
    }
    animate(dragX, 0, reduceMotion ? INSTANT : SETTLE);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    <div>
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Portfolio"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`relative h-[min(64vh,30rem)] min-h-[20rem] touch-pan-y select-none rounded-3xl ${FOCUS_RING}`}
      >
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag={n > 1 ? 'x' : false}
          dragMomentum={false}
          style={{ x: dragX }}
          onDragStart={() => {
            draggedRef.current = true;
          }}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, itemIndex) => {
            const distance = n === 1 ? 0 : shortestOffset(itemIndex, index, n);
            const isActive = distance === 0;
            const near = Math.abs(distance) === 1;
            const visible = Math.abs(distance) <= 1;
            const pose = isActive
              ? { x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }
              : {
                  x: distance * step,
                  scale: near ? (desktop ? 0.78 : 0.7) : 0.6,
                  opacity: near ? (desktop ? 0.5 : 0.3) : 0,
                  filter: `blur(${near ? (desktop ? 1 : 2) : 4}px)`,
                };

            return (
              <div
                key={item.id}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ zIndex: isActive ? 20 : near ? 10 : 0 }}
              >
                <motion.button
                  type="button"
                  initial={false}
                  animate={pose}
                  transition={reduceMotion ? INSTANT : isActive ? POP : SETTLE}
                  tabIndex={visible && !isActive ? 0 : -1}
                  aria-hidden={visible ? undefined : true}
                  aria-label={isActive ? item.title : `Toon ${item.title}`}
                  onClick={() => {
                    if (!draggedRef.current && !isActive) goTo(itemIndex);
                  }}
                  style={{ pointerEvents: visible ? 'auto' : 'none' }}
                  className={`shadow-luxe-lg relative aspect-[4/5] w-[min(64vw,19rem)] overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-taupe/30 will-change-transform ${FOCUS_RING}`}
                >
                  {/* Plain img: portfoliofoto's komen uit Supabase Storage (extern domein). */}
                  <img
                    src={item.src}
                    alt={isActive ? item.title : ''}
                    loading={visible ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    className={`h-full w-full select-none ${
                      item.cutout
                        ? 'bg-gradient-to-b from-blush/50 to-canvas object-contain p-6'
                        : 'object-cover'
                    }`}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2.5 rounded-[1.35rem] border border-white/50"
                  />
                </motion.button>
              </div>
            );
          })}
        </motion.div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Vorige foto"
              className={`absolute left-1 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-taupe/50 bg-card/85 text-primary shadow-sm backdrop-blur transition-transform active:scale-95 md:flex ${FOCUS_RING}`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Volgende foto"
              className={`absolute right-1 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-taupe/50 bg-card/85 text-primary shadow-sm backdrop-blur transition-transform active:scale-95 md:flex ${FOCUS_RING}`}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p aria-live="polite" className="text-[12px] font-medium tabular-nums tracking-[0.2em] text-primary/50">
          {pad(mod(index, n) + 1)} — {pad(n)}
        </p>
        <p className="font-serif text-2xl text-stone-900">{active.title}</p>
        {active.tags.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-1.5">
            {active.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-taupe/50 px-2.5 py-0.5 text-[11px] text-primary/70"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PortfolioGallery({ entries }: { entries: readonly PortfolioEntry[] }) {
  const counts = useMemo(() => {
    const map = new Map<PortfolioCategoryId, number>();
    for (const entry of entries) map.set(entry.categoryId, (map.get(entry.categoryId) ?? 0) + 1);
    return map;
  }, [entries]);

  const firstWithItems =
    PORTFOLIO_CATEGORIES.find((category) => (counts.get(category.id) ?? 0) > 0)?.id ?? 'nails';
  const [categoryId, setCategoryId] = useState<PortfolioCategoryId>(firstWithItems);
  const [tag, setTag] = useState<string | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const inCategory = entries.filter((entry) => entry.categoryId === categoryId);
  const tags = useMemo(
    () =>
      Array.from(new Set(inCategory.flatMap((entry) => entry.tags))).sort((a, b) =>
        a.localeCompare(b, 'nl'),
      ),
    [inCategory],
  );
  const visible = tag ? inCategory.filter((entry) => entry.tags.includes(tag)) : inCategory;
  const categoryTitle = PORTFOLIO_CATEGORIES.find((c) => c.id === categoryId)?.title ?? '';

  return (
    <div className="mt-10">
      {/* Segmentknop zoals in iOS: de actieve pil schuift mee. */}
      <LayoutGroup>
        <div
          role="tablist"
          aria-label="Categorie"
          className="mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-taupe/40 bg-card/70 p-1 backdrop-blur"
        >
          {PORTFOLIO_CATEGORIES.map((category) => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setCategoryId(category.id);
                  setTag(null);
                }}
                className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
                  selected ? 'text-canvas' : 'text-primary/70 hover:text-primary'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="portfolio-pill"
                    transition={reduceMotion ? INSTANT : { type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                )}
                <span className="relative">{category.title}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Filter op stijl">
          {[null, ...tags].map((value) => {
            const selected = tag === value;
            return (
              <button
                key={value ?? 'alles'}
                type="button"
                aria-pressed={selected}
                onClick={() => setTag(value)}
                className={`rounded-full px-3 py-1 text-[12px] transition-colors duration-200 ${FOCUS_RING} ${
                  selected
                    ? 'bg-accent text-white'
                    : 'border border-taupe/50 text-primary/70 hover:border-accent/40 hover:text-accent-dark'
                }`}
              >
                {value ? `#${value}` : 'Alles'}
              </button>
            );
          })}
        </div>
      )}

      <div aria-hidden="true" className="hairline mx-auto mt-8 h-px max-w-md" />

      <div className="mt-8">
        {visible.length > 0 ? (
          <FramedCarousel key={`${categoryId}-${tag ?? 'all'}`} items={visible} />
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center rounded-[1.75rem] border border-dashed border-taupe/60 bg-card/60 px-8 py-14 text-center">
            <span aria-hidden="true" className="h-2 w-2 rotate-45 border border-taupe" />
            <p className="mt-5 font-serif text-2xl text-stone-900">Binnenkort te zien</p>
            <p className="mt-2 text-[14px] leading-relaxed text-primary/65">
              Er staan nog geen foto&apos;s bij {categoryTitle.toLowerCase()}. Volg ondertussen
              @_belise._ op Instagram.
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href={categoryId === 'massage' ? '/booking' : `/booking?category=${categoryId}`}
          className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent ${FOCUS_RING}`}
        >
          Boek {categoryTitle.toLowerCase()}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
