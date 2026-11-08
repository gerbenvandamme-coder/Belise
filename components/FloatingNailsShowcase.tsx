'use client';

import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const INSTAGRAM_URL = 'https://www.instagram.com/_belise._/';

/** Alle transparante PNG's in public/assets/showcase_cutouts/. Nieuwe bestanden voeg je hier toe. */
const CUTOUT_FILES = [
  'Screenshot 2026-11-07 160746.png',
  'Screenshot 2026-11-07 160757.png',
  'Screenshot 2026-11-07 160813.png',
  'Screenshot 2026-11-07 160839.png',
  'Screenshot 2026-11-07 160848.png',
  'Screenshot 2026-11-07 160900.png',
  'Screenshot 2026-11-07 161012.png',
  'Screenshot 2026-11-07 161025.png',
  'Screenshot 2026-11-07 175637.png',
  'Screenshot 2026-11-07 175649.png',
  'Screenshot 2026-11-07 175658.png',
  'Screenshot 2026-11-07 175705.png',
  'Screenshot 2026-11-07 175713.png',
  'Screenshot 2026-11-07 175720.png',
  'Screenshot 2026-11-07 175732.png',
  'Screenshot 2026-11-07 175745.png',
  'Screenshot 2026-11-07 175756.png',
  'Screenshot 2026-11-07 175822.png',
] as const;

/** Parallax-afstand in px per item. Het ritme herhaalt zich over de items. */
const DRIFTS = [24, -18, 30, -12, 20, -26] as const;
/** Maximale rotatie in graden tijdens de scroll. */
const TILTS = [4, -3, 3, -4, 2, -2] as const;
/** Verticale verschuiving op desktop, voor het getrapte ritme. */
const LANES = ['lg:mt-0', 'lg:mt-10', 'lg:mt-4', 'lg:mt-16', 'lg:mt-8', 'lg:mt-20'] as const;

type NailSet = {
  src: string;
  name: string;
  drift: number;
  tilt: number;
  floatDelay: number;
  lane: string;
};

const NAIL_SETS: readonly NailSet[] = CUTOUT_FILES.map((file, index) => ({
  src: `/assets/showcase_cutouts/${encodeURIComponent(file)}`,
  name: `Set ${String(index + 1).padStart(2, '0')}`,
  drift: DRIFTS[index % DRIFTS.length],
  tilt: TILTS[index % TILTS.length],
  floatDelay: (index % 6) * 0.4,
  lane: LANES[index % LANES.length],
}));

type NailItemProps = {
  set: NailSet;
  progress: MotionValue<number>;
  reduceMotion: boolean;
};

function NailItem({ set, progress, reduceMotion }: NailItemProps) {
  const y = useTransform(progress, [0, 1], [set.drift, -set.drift]);
  const rotate = useTransform(progress, [0, 0.5, 1], [-set.tilt, set.tilt, -set.tilt]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.94, 1, 0.94]);

  return (
    <motion.li
      className={`w-[70vw] shrink-0 snap-center sm:w-[46vw] md:w-auto ${set.lane}`}
      style={reduceMotion ? undefined : { y, rotate, scale }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, delay: set.floatDelay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${set.name}, bekijk meer op Instagram @_belise._`}
          className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe"
          whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 1.5 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img
            src={set.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="block h-auto w-full select-none drop-shadow-[0_20px_30px_rgba(28,25,23,0.10)]"
          />
          <span className="mx-auto mt-4 flex w-max max-w-full items-center rounded-full bg-primary px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-canvas">
            {set.name}
          </span>
        </motion.a>
      </motion.div>
    </motion.li>
  );
}

export default function FloatingNailsShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const headingY = useTransform(scrollYProgress, [0, 1], [48, -48]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="showcase-heading"
      className="overflow-hidden bg-canvas py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div style={reduceMotion ? undefined : { y: headingY }}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/55">
            Showcase
          </p>
          <h2
            id="showcase-heading"
            className="mt-4 font-serif font-normal leading-[1] tracking-[-0.02em] text-stone-900 text-4xl sm:text-5xl lg:text-6xl"
          >
            Recente sets
          </h2>
        </motion.div>

        <ul className="-mx-6 mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain px-6 pb-8 pt-10 md:mx-0 md:grid md:grid-cols-3 md:gap-x-10 md:gap-y-16 md:overflow-visible md:px-0 md:pb-0 md:pt-0 lg:grid-cols-6 lg:gap-x-8">
          {NAIL_SETS.map((set) => (
            <NailItem
              key={set.src}
              set={set}
              progress={scrollYProgress}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}