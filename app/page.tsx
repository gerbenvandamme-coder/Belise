import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Palette } from 'lucide-react';
import NailCarouselShowcase from '@/components/NailCarouselShowcase';
import {
  TREATMENT_CATEGORIES,
  formatPrice,
  type TreatmentCategory,
  type TreatmentItem,
} from '@/lib/treatments';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:active:scale-100';

function getStartingPrice(treatments: readonly TreatmentItem[]): number | null {
  if (treatments.length === 0) return null;
  return Math.min(...treatments.map((treatment) => treatment.priceEuro));
}

function TreatmentRow({ treatment }: { treatment: TreatmentItem }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary">{treatment.title}</p>
        <p className="mt-0.5 truncate text-xs text-primary/65">{treatment.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-primary">{formatPrice(treatment.priceEuro)}</p>
        <p className="text-xs text-primary/60">{treatment.durationMinutes} min</p>
      </div>
    </li>
  );
}

function TreatmentCard({ category }: { category: TreatmentCategory }) {
  const headingId = `treatment-${category.id}`;
  const startingPrice = getStartingPrice(category.treatments);

  return (
    <Link
      href={`/booking?category=${category.id}`}
      aria-labelledby={headingId}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25 transition-shadow duration-300 hover:ring-accent/40 hover:shadow-[0_28px_50px_-28px_rgba(28,25,23,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe motion-reduce:transition-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02] group-hover:blur-[1.5px] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:blur-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-px h-3/4 bg-gradient-to-b from-card/0 via-card/60 to-card"
        />
      </div>

      <div className="relative z-10 -mt-14 flex flex-1 flex-col px-8 pb-8">
        <h3
          id={headingId}
          className="font-serif text-2xl font-bold leading-tight tracking-[-0.01em] text-stone-900"
        >
          {category.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-primary/65">{category.subtitle}</p>

        {startingPrice !== null && (
          <p className="mt-5 flex items-baseline gap-3 border-t border-taupe/30 pt-5">
            <span className="text-xs uppercase tracking-[0.18em] text-primary/55">Vanaf</span>
            <span className="font-serif text-3xl font-medium leading-none text-primary">
              {formatPrice(startingPrice)}
            </span>
          </p>
        )}

        <ul className="mt-4 flex-1 divide-y divide-taupe/25 border-t border-taupe/30">
          {category.treatments.map((treatment) => (
            <TreatmentRow key={treatment.id} treatment={treatment} />
          ))}
        </ul>

        <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 group-hover:bg-accent-dark group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100">
          Boek deze behandeling
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main id="top" className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-20">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Beautysalon · Opwijk
        </p>
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <h1 className="relative max-w-full overflow-x-clip break-normal font-serif font-bold leading-[0.85] tracking-[-0.03em] text-stone-900">
            <span className="block text-[length:clamp(3.5rem,13vw,11rem)]">Belise</span>
            <span className="-mt-2 block text-[length:clamp(2rem,7vw,6rem)] italic leading-none tracking-[0.02em] text-accent sm:-mt-5">
              Beauty
            </span>
          </h1>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(28,25,23,0.35)] ring-1 ring-taupe/30 lg:max-w-none">
            <Image
              src="/assets/front/Clean%20front%20picture.jpg"
              alt="Zaakvoerder van Belise"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <div className="max-w-2xl">
            <p className="max-w-lg text-base leading-relaxed text-primary/70 sm:text-lg">
              Bij Belise nemen we de tijd voor jou. Van make-up en haarstyling tot nagelverzorging
              voor handen en voeten: elke behandeling wordt afgestemd op jouw stijl en je dagelijkse
              leven.
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
                href="/booking"
                className={`${buttonBase} border border-primary/25 text-primary hover:border-primary hover:bg-blush/50`}
              >
                Boek behandeling
              </a>
            </div>
          </div>
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
            <h2 className="mt-4 font-serif font-normal leading-[1] tracking-[-0.02em] text-stone-900 text-4xl sm:text-5xl lg:text-6xl">
              Zorg die bij <span className="italic text-primary/80">jou</span> past
            </h2>
            <p className="mt-6 text-base leading-relaxed text-primary/70">
              Kies een behandeling als vertrekpunt. De prijzen zijn richtprijzen. De definitieve
              prijs hangt af van lengte, design en eventuele verwijdering van een oude set.
            </p>
          </div>

          <div id="tarieven" className="mt-14 grid gap-8 md:grid-cols-2">
            {TREATMENT_CATEGORIES.map((category) => (
              <TreatmentCard key={category.id} category={category} />
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
              <h2 className="mt-5 font-serif font-normal leading-[1] tracking-[-0.02em] text-4xl sm:text-5xl lg:text-6xl">
                Twijfel je over{' '}
                <span className="italic text-taupe">vorm</span>{' '}
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