import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, HeartHandshake, MapPin } from 'lucide-react';
import Ornament from '@/components/Ornament';
import PageHeader from '@/components/PageHeader';
import { ABOUT, SALON, isFilledIn } from '@/lib/salon';

const TITLE = 'Over Belise | Beautysalon in Opwijk';
const DESCRIPTION =
  'Maak kennis met Belise: een beautysalon in Opwijk waar elke behandeling op afspraak en met aandacht gebeurt.';

const PATH = '/over';
const TYPE = 'AboutPage';

export const metadata: Metadata = pageMetadata(PATH, TITLE, DESCRIPTION);

const PRINCIPLES = [
  {
    icon: HeartHandshake,
    title: 'Aandacht voor jou',
    text: 'Elke behandeling wordt afgestemd op jouw stijl en je dagelijkse leven, niet op een vast stramien.',
  },
  {
    icon: CalendarCheck,
    title: 'Enkel op afspraak',
    text: 'Je krijgt de tijd en de rust die bij de behandeling horen. Kijk online wanneer er plaats is.',
  },
  {
    icon: MapPin,
    title: 'In Opwijk',
    text: `${SALON.address.street}, ${SALON.address.postalCity}. Je boekt en beheert je afspraken zelf online.`,
  },
] as const;

export default function OverPage() {
  const ownerName = isFilledIn(ABOUT.ownerName) ? ABOUT.ownerName : null;

  return (
    <main className="flex-1">
      <JsonLd data={pageSchema({ path: PATH, name: TITLE, description: DESCRIPTION, type: TYPE })} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <PageHeader
              eyebrow="Over Belise"
              title={
                <>
                  Tijd nemen voor <span className="italic text-accent">jou</span>
                </>
              }
            >
              <p>
                Belise is een beautysalon in Opwijk voor nagels, ontharing en haarverzorging. Je komt
                op afspraak, zodat er ruimte is voor een goed gesprek en een resultaat waar je
                tevreden mee bent.
              </p>
            </PageHeader>

            {ABOUT.story.length > 0 && (
              <div className="reveal mt-8 max-w-xl space-y-4 text-[15px] leading-relaxed text-primary/75">
                {ABOUT.story.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Afspraak maken
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-primary/25 px-6 py-3 text-[13px] font-medium text-primary transition-colors hover:border-primary hover:bg-blush/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Contact
              </Link>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm lg:ml-auto lg:mr-4 lg:max-w-[22rem]">
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-taupe/70 sm:translate-x-5 sm:translate-y-5"
              />
              <div className="shadow-luxe-lg relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] ring-1 ring-taupe/30">
                <Image
                  src="/assets/Front/Clean%20front%20picture.jpg"
                  alt={ownerName ? `${ownerName}, zaakvoerder van Belise` : 'Zaakvoerder van Belise'}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className="mt-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/55">
              <span aria-hidden="true" className="hairline h-px flex-1" />
              {ownerName ?? 'Zaakvoerder'}
              <span aria-hidden="true" className="hairline h-px flex-1" />
            </figcaption>
          </figure>
        </div>
      </section>

      <Ornament className="px-6" />

      <section className="mx-auto max-w-6xl px-6 py-14 lg:px-8 lg:py-20">
        <ul className="grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="reveal shadow-luxe rounded-[1.75rem] bg-card p-6 ring-1 ring-taupe/25"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark ring-1 ring-accent/15">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-serif text-2xl text-stone-900">{title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-primary/65">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-8 lg:pb-28">
        <div className="reveal max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            De salon
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-[1.05] tracking-[-0.02em] text-stone-900 sm:text-4xl">
            Een kijkje <span className="italic text-primary/80">binnen</span>
          </h2>
        </div>

        {ABOUT.photos.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT.photos.map((photo) => (
              <li
                key={photo.src}
                className="reveal shadow-luxe relative aspect-[4/3] overflow-hidden rounded-[1.75rem] ring-1 ring-taupe/25"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 flex max-w-xl flex-col items-start rounded-[1.75rem] border border-dashed border-taupe/60 bg-card/60 px-8 py-12">
            <span aria-hidden="true" className="h-2 w-2 rotate-45 border border-taupe" />
            <p className="mt-5 font-serif text-2xl text-stone-900">Binnenkort te zien</p>
            <p className="mt-2 text-[14px] leading-relaxed text-primary/65">
              Foto&apos;s van de salon volgen. Wil je nu al een indruk? Kijk op Instagram naar{' '}
              <a
                href={SALON.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-dark underline-offset-4 hover:underline"
              >
                @{SALON.instagram.handle}
              </a>
              .
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
