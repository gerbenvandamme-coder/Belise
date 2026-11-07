import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Droplets, Paintbrush, Palette, Sparkles } from 'lucide-react';
import NailCarouselShowcase from '@/components/NailCarouselShowcase';

type Treatment = {
  id: string;
  title: string;
  tagline: string;
  icon: ReactNode;
  price: string;
  duration: string;
  includes: readonly string[];
};

const TREATMENTS: readonly Treatment[] = [
  {
    id: 'biab',
    title: 'BIAB & Natural Nail Treatment',
    tagline: 'Versteviging van de natuurlijke nagel',
    icon: <Droplets size={22} aria-hidden="true" />,
    price: '€45',
    duration: '60 – 75 min',
    includes: [
      'Nagelanalyse en voorbehandeling',
      'Vijlen en nagelriemverzorging',
      'BIAB-laag voor extra sterkte',
      'Afwerking met verzorgende olie',
    ],
  },
  {
    id: 'gellak',
    title: 'Gellak & Manicure',
    tagline: 'Duurzame kleur met hoogglans',
    icon: <Sparkles size={22} aria-hidden="true" />,
    price: '€38',
    duration: '45 – 60 min',
    includes: [
      'Manicure met nagelriemverzorging',
      'Vormgeven van de nagels',
      'Gellak in een kleur naar keuze',
      'Hoogglans topcoat en olie',
    ],
  },
  {
    id: 'nail-art',
    title: 'Custom Nail Art & Extensions',
    tagline: 'Vormverlenging, handgetekende designs',
    icon: <Paintbrush size={22} aria-hidden="true" />,
    price: '€65',
    duration: '90 – 120 min',
    includes: [
      'Persoonlijk intakegesprek over vorm en stijl',
      'Verlenging op tip of vorm',
      'Handgetekende designs en accenten',
      'Finish met topcoat en olie',
    ],
  },
] as const;

const NAIL_SHAPES = [
  { x: 37, height: 170, fill: '#FAF7F2' },
  { x: 105, height: 205, fill: '#E8D5CE' },
  { x: 173, height: 225, fill: '#D4B8A5' },
  { x: 241, height: 205, fill: '#1C1917' },
  { x: 309, height: 150, fill: '#E8D5CE' },
] as const;

const NAIL_WIDTH = 54;
const NAIL_BASELINE = 400;

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:active:scale-100';

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-canvas to-taupe/70 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.35)] ring-1 ring-taupe/30">
        <svg
          viewBox="0 0 400 500"
          role="img"
          aria-label="Illustratie van vijf nagels in zachte neutrale tinten"
          className="absolute inset-0 h-full w-full"
        >
          <circle cx="200" cy="250" r="170" fill="#FFFFFF" opacity="0.45" />
          {NAIL_SHAPES.map((nail) => (
            <g key={nail.x}>
              <rect
                x={nail.x}
                y={NAIL_BASELINE - nail.height}
                width={NAIL_WIDTH}
                height={nail.height}
                rx={NAIL_WIDTH / 2}
                fill={nail.fill}
                stroke="#1C1917"
                strokeOpacity="0.08"
              />
              <rect
                x={nail.x + 12}
                y={NAIL_BASELINE - nail.height + 18}
                width="7"
                height={nail.height * 0.45}
                rx="3.5"
                fill="#FFFFFF"
                opacity="0.55"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-card/90 px-5 py-4 shadow-[0_20px_40px_-24px_rgba(28,25,23,0.4)] ring-1 ring-taupe/30 backdrop-blur-md">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <p className="text-sm leading-snug">
          <span className="block font-semibold text-primary">Op maat gemaakt</span>
          <span className="block text-primary/60">Vorm, kleur en finish</span>
        </p>
      </div>
    </div>
  );
}

function TreatmentCard({ treatment }: { treatment: Treatment }) {
  const headingId = `treatment-${treatment.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col rounded-3xl bg-card p-8 shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25 transition-shadow duration-300 hover:ring-accent/40 hover:shadow-[0_28px_50px_-28px_rgba(28,25,23,0.4)] motion-reduce:transition-none"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark ring-1 ring-accent/20">
        {treatment.icon}
      </span>

      <h3
        id={headingId}
        className="mt-6 font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-stone-900"
      >
        {treatment.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-primary/65">{treatment.tagline}</p>

      <div className="mt-6 flex items-end justify-between border-y border-taupe/30 py-5">
        <p>
          <span className="block text-xs uppercase tracking-[0.18em] text-primary/55">Vanaf</span>
          <span className="font-serif text-4xl font-medium leading-none text-primary">
            {treatment.price}
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm text-primary/70">
          <Clock size={16} aria-hidden="true" />
          {treatment.duration}
        </p>
      </div>

      <div className="mt-6 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Inbegrepen
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-primary/80">
          {treatment.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href="#contact"
        className="group mt-8 inline-flex items-center gap-2 self-start text-sm font-medium text-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe"
      >
        <span className="border-b border-primary/30 pb-0.5 transition-colors group-hover:border-accent group-hover:text-accent-dark">
          Boek deze behandeling
        </span>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </a>
    </article>
  );
}

export default function HomePage() {
  return (
    <main id="top" className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-20">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Nagelsalon · Opwijk
        </p>
        <h1 className="relative mt-4 max-w-full overflow-x-clip break-normal font-headline font-normal leading-[0.92] tracking-[-0.02em] text-stone-900">
          <span className="block text-[length:clamp(2.75rem,9vw,8rem)]">Belise</span>
          <span className="block pl-[0.12em] text-[length:clamp(2.75rem,9vw,8rem)] italic">
            Manicure
          </span>
          <span className="-mt-[0.1em] block origin-left -rotate-2 font-script text-[length:clamp(3.5rem,11vw,10rem)] font-normal leading-none tracking-normal text-accent">
            Opwijk
          </span>
        </h1>

        <div className="mt-10 grid items-center gap-16 lg:mt-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="max-w-lg text-base leading-relaxed text-primary/70 sm:text-lg">
              Bij Belise nemen we de tijd voor jouw nagels. Van versterkende behandelingen tot
              handgetekende nail art: elke set wordt afgestemd op je handen, je stijl en je
              dagelijkse leven.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/designer"
                className={`${buttonBase} bg-primary text-canvas shadow-sm hover:bg-accent hover:shadow-md`}
              >
                <Palette size={16} aria-hidden="true" />
                Ontwerp je nagels
              </Link>
              <a
                href="#contact"
                className={`${buttonBase} border border-primary/25 text-primary hover:border-primary hover:bg-blush/50`}
              >
                Boek behandeling
              </a>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <NailCarouselShowcase />

      {/* Behandelingen & Prijzen */}
      <section id="behandelingen" className="bg-blush/30 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              Behandelingen & prijzen
            </p>
            <h2 className="mt-4 font-headline font-normal leading-[1] tracking-[-0.02em] text-stone-900 text-4xl sm:text-5xl lg:text-6xl">
              Zorg die past bij{' '}
              <span className="font-script text-[1.25em] leading-none text-primary/80">jouw</span>{' '}
              nagels
            </h2>
            <p className="mt-6 text-base leading-relaxed text-primary/70">
              Kies een behandeling als vertrekpunt. De prijzen zijn richtprijzen. De definitieve
              prijs hangt af van lengte, design en eventuele verwijdering van een oude set.
            </p>
          </div>

          <div id="tarieven" className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {TREATMENTS.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </div>
        </div>
      </section>

      {/* Teaser Nagel Designer */}
      <section id="nagel-designer" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-canvas shadow-[0_30px_60px_-30px_rgba(28,25,23,0.5)] sm:px-14 lg:px-20 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 right-32 h-72 w-72 rounded-full bg-blush/10 blur-3xl"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-taupe">
                <Palette size={16} aria-hidden="true" />
                Nagel Designer
              </p>
              <h2 className="mt-5 font-headline font-normal leading-[1] tracking-[-0.02em] text-4xl sm:text-5xl lg:text-6xl">
                Twijfel je over{' '}
                <span className="font-script text-[1.25em] leading-none text-taupe">vorm</span>{' '}
                of kleur?
              </h2>
              <p className="mt-6 text-base leading-relaxed text-canvas/75 sm:text-lg">
                Test je ideale set live in onze online designer voor je naar de salon komt.
              </p>
            </div>

            <Link
              href="/designer"
              className={`${buttonBase} bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md`}
            >
              Start de designer
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}