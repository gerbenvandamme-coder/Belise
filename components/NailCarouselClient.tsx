'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/_belise._/';
const DESKTOP_BREAKPOINT = 768;
const DESKTOP_STEP_RATIO = 0.34;
const MOBILE_STEP_RATIO = 0.62;
const MAX_FLICK_STEPS = 3;

/** Actieve set: tastbare veer met lichte overshoot, omdat de gebruiker er naartoe gaat. */
const POP = { type: 'spring', stiffness: 280, damping: 22, mass: 0.8 } as const;
/** Overige sets: critisch gedempte veer, zonder doorschieten. */
const SETTLE = { type: 'spring', stiffness: 260, damping: 34, mass: 1 } as const;
const INSTANT = { duration: 0 } as const;

export type CarouselItem = {
  src: string;
  name: string;
};

type Props = {
  items: readonly CarouselItem[];
};

type Pose = {
  x: number;
  scale: number;
  opacity: number;
  filter: string;
  zIndex: number;
};

function mod(value: number, n: number): number {
  return ((value % n) + n) % n;
}

/** Afstand van item i tot de actieve index, met wrap-around. Resultaat ligt in (-n/2, n/2]. */
function shortestOffset(itemIndex: number, activeIndex: number, n: number): number {
  let distance = mod(itemIndex - activeIndex, n);
  if (distance > n / 2) distance -= n;
  return distance;
}

function poseFor(distance: number, step: number, desktop: boolean): Pose {
  if (distance === 0) {
    return {
      x: 0,
      scale: desktop ? 1.25 : 1.1,
      opacity: 1,
      filter: 'drop-shadow(0 30px 40px rgba(28,25,23,0.18)) blur(0px)',
      zIndex: 20,
    };
  }

  if (Math.abs(distance) === 1) {
    return {
      x: distance * step,
      scale: desktop ? 0.75 : 0.55,
      opacity: desktop ? 0.4 : 0.25,
      filter: `drop-shadow(0 20px 30px rgba(28,25,23,0.10)) blur(${desktop ? 1 : 2}px)`,
      zIndex: 10,
    };
  }

  return {
    x: distance * step,
    scale: 0.6,
    opacity: 0,
    filter: 'drop-shadow(0 20px 30px rgba(28,25,23,0.10)) blur(4px)',
    zIndex: 0,
  };
}

export default function NailCarouselClient({ items }: Props) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const dragX = useMotionValue(0);
  const backgroundX = useTransform(dragX, (value) => value * -0.3);
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

  if (n === 0) {
    return null;
  }

  const desktop = width >= DESKTOP_BREAKPOINT;
  const step = width * (desktop ? DESKTOP_STEP_RATIO : MOBILE_STEP_RATIO);
  const popTransition = reduceMotion ? INSTANT : POP;
  const settleTransition = reduceMotion ? INSTANT : SETTLE;
  const active = items[index];

  const goTo = (target: number) => setIndex(mod(target, n));
  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  const handleDragStart = () => {
    draggedRef.current = true;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (step > 0) {
      const projected = info.offset.x + info.velocity.x * 0.15;
      const steps = Math.max(
        -MAX_FLICK_STEPS,
        Math.min(MAX_FLICK_STEPS, Math.round(-projected / step)),
      );
      if (steps !== 0) {
        setIndex((current) => mod(current + steps, n));
      }
    }

    animate(dragX, 0, settleTransition);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
  };

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    <section
      aria-labelledby="carousel-heading"
      className="overflow-hidden bg-canvas py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/55">
          Showcase
        </p>
        <h2
          id="carousel-heading"
          className="mt-4 font-serif font-normal leading-[1] tracking-[-0.02em] text-stone-900 text-4xl sm:text-5xl lg:text-6xl"
        >
          Recente sets
        </h2>

        <div
          ref={stageRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Nagelsets"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative mt-14 h-[min(70vh,34rem)] min-h-[22rem] touch-pan-y select-none rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <motion.span
              style={reduceMotion ? undefined : { x: backgroundX }}
              className="whitespace-nowrap font-serif font-bold uppercase leading-none tracking-tighter text-stone-900/[0.04] text-[18vw]"
            >
              Belise
            </motion.span>
          </div>

          <motion.div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            drag="x"
            dragMomentum={false}
            style={{ x: dragX }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {items.map((item, itemIndex) => {
              const distance = shortestOffset(itemIndex, index, n);
              const pose = poseFor(distance, step, desktop);
              const isActive = distance === 0;
              const isVisible = Math.abs(distance) <= 1;

              return (
                <div
                  key={item.src}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: pose.zIndex }}
                >
                  <motion.div
                    className="w-[min(56vw,20rem)] will-change-transform"
                    initial={false}
                    animate={{
                      x: pose.x,
                      scale: pose.scale,
                      opacity: pose.opacity,
                      filter: pose.filter,
                    }}
                    transition={isActive ? popTransition : settleTransition}
                    style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
                  >
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      tabIndex={isVisible ? 0 : -1}
                      aria-hidden={isVisible ? undefined : true}
                      aria-label={
                        isActive
                          ? `${item.name}, bekijk meer op Instagram`
                          : `Ga naar ${item.name}`
                      }
                      onClick={(event) => {
                        if (draggedRef.current || !isActive) {
                          event.preventDefault();
                        }
                        if (!draggedRef.current && !isActive) {
                          goTo(itemIndex);
                        }
                      }}
                      className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe"
                    >
                      <img
                        src={item.src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="block h-auto w-full select-none"
                      />
                    </a>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Vorige set"
            className="absolute left-2 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-stone-900 shadow-sm backdrop-blur transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe md:flex"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Volgende set"
            className="absolute right-2 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-stone-900 shadow-sm backdrop-blur transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe md:flex"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p aria-live="polite" className="text-sm font-medium tabular-nums text-primary/60">
            {pad(index + 1)} / {pad(n)}
          </p>
          <span className="rounded-full bg-primary px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-canvas">
            {active.name}
          </span>
        </div>
      </div>
    </section>
  );
}