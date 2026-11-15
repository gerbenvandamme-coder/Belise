import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import NailCanvas from '@/components/NailCanvas';
import type { Cutout } from '@/lib/showcase';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
const CARD =
  'reveal ease-luxe group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-[2rem] p-7 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8';
// Eén warme kleurfamilie, van diep rozenhout (belangrijkst) naar ivoor: een rustige overloop.
const TONE = {
  rosewood: `${CARD} shadow-luxe-lg bg-gradient-to-br from-[#7A4652] via-[#8E5763] to-[#A46F79] text-canvas hover:shadow-luxe-lg`,
  rose: `${CARD} shadow-luxe bg-gradient-to-br from-[#EBCFD4] to-[#F6E5E8] ring-1 ring-[#E2C3C9]/60 hover:shadow-luxe-lg`,
  blush: `${CARD} shadow-luxe bg-gradient-to-br from-[#F2E3DC] to-[#FAF1EC] ring-1 ring-taupe/30 hover:shadow-luxe-lg`,
  champagne: `${CARD} shadow-luxe bg-gradient-to-br from-[#EEE2D2] to-[#F8F1E7] ring-1 ring-taupe/35 hover:shadow-luxe-lg`,
  ivory: `${CARD} shadow-luxe bg-card ring-1 ring-taupe/25 hover:shadow-luxe-lg`,
} as const;

function Head({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-[#F3DCE0]' : 'text-accent-dark'}`}
      >
        {n} · {label}
      </span>
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-500 group-hover:rotate-12 group-hover:bg-accent group-hover:text-white motion-reduce:transition-none motion-reduce:group-hover:rotate-0 ${
          dark ? 'border-white/35 text-canvas' : 'border-primary/15 text-primary'
        }`}
      >
        <ArrowUpRight size={16} />
      </span>
    </div>
  );
}

/**
 * Kruispunt op de homepage: de belangrijkste bestemmingen, op volgorde van belang.
 * 01 boeken, 02 behandelingen, 03 portfolio, 04 designer, 05 over, 06 contact.
 */
export default function HomeCrossroads({
  categoryTitles,
  cutouts,
}: {
  categoryTitles: readonly string[];
  cutouts: readonly Cutout[];
}) {
  const fan = cutouts.slice(0, 3);
  const fanPoses = [
    'group-hover:-translate-x-6 group-hover:-rotate-[14deg] -rotate-[6deg]',
    'group-hover:-translate-y-2 rotate-0',
    'group-hover:translate-x-6 group-hover:rotate-[14deg] rotate-[6deg]',
  ];

  return (
    <section aria-labelledby="crossroads-heading" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-28">
      <div className="reveal max-w-2xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Ontdek Belise
        </p>
        <h2
          id="crossroads-heading"
          className="mt-4 font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-stone-900 sm:text-5xl lg:text-6xl"
        >
          Waar wil je <span className="italic text-primary/80">naartoe?</span>
        </h2>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-6">
        {/* 01 Boeken */}
        <Link href="/booking" className={`${TONE.rosewood} lg:col-span-4 ${FOCUS}`}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#F3C9D2]/25 blur-3xl transition-transform duration-700 group-hover:scale-125 motion-reduce:transition-none"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-white/20"
          />
          <Head n="01" label="Boeken" dark />
          <div className="relative mt-10">
            <h3 className="font-serif text-4xl leading-none sm:text-5xl">
              Afspraak <span className="italic text-[#F6DDE2]">maken</span>
            </h3>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-canvas/80">
              Kies je behandeling en een moment dat past. Je ziet meteen wanneer er plaats is.
            </p>
          </div>
        </Link>

        {/* 02 Behandelingen */}
        <Link href="/behandelingen" className={`${TONE.rose} lg:col-span-2 ${FOCUS}`}>
          <Head n="02" label="Behandelingen" />
          <div className="mt-10">
            <h3 className="font-serif text-3xl leading-tight text-stone-900">Behandelingen &amp; prijzen</h3>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {categoryTitles.map((title) => (
                <li
                  key={title}
                  className="rounded-full border border-primary/15 bg-white/50 px-2.5 py-0.5 text-[11px] text-primary/75"
                >
                  {title}
                </li>
              ))}
            </ul>
          </div>
        </Link>

        {/* 03 Portfolio */}
        <Link href="/portfolio" className={`${TONE.blush} min-h-[19rem] lg:col-span-3 ${FOCUS}`}>
          <Head n="03" label="Portfolio" />
          {fan.length > 0 && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-14 flex h-40 justify-center">
              {fan.map((cutout, index) => (
                <div
                  key={cutout.src}
                  className={`ease-luxe absolute top-0 h-36 w-28 transition-transform duration-700 motion-reduce:transition-none sm:h-40 sm:w-32 ${fanPoses[index]}`}
                  style={{ left: `calc(50% + ${(index - 1) * 5}rem - 3.5rem)` }}
                >
                  <Image
                    src={cutout.src}
                    alt=""
                    fill
                    sizes="8rem"
                    className="object-contain drop-shadow-[0_12px_14px_rgba(60,40,30,0.22)]"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-48">
            <h3 className="font-serif text-3xl leading-tight text-stone-900">Ons werk</h3>
            <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-primary/65">
              Blader per behandeling door recente resultaten en filter op stijl.
            </p>
          </div>
        </Link>

        {/* 04 Designer */}
        <Link href="/designer" className={`${TONE.champagne} min-h-[19rem] lg:col-span-3 ${FOCUS}`}>
          <Head n="04" label="Nageldesigner" />
          <div className="mt-6 grid items-end gap-5 sm:grid-cols-[1fr_1.15fr]">
            <div>
              <h3 className="font-serif text-3xl leading-tight text-stone-900">
                Twijfel je over <span className="italic text-accent-dark">vorm of kleur?</span>
              </h3>
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-primary/65">
                Test je ideale set live op een echte hand, voor je naar de salon komt.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="ease-luxe overflow-hidden rounded-2xl ring-1 ring-taupe/40 transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
            >
              <NailCanvas
                shape="almond"
                length="medium"
                baseColor="#7E2F43"
                accentColor="#F5F0E8"
                finish="glossy"
                pattern="solid"
                accentRingOnly={false}
                hand="goud"
                className="rounded-none"
              />
            </div>
          </div>
        </Link>

        {/* 05 Over */}
        <Link href="/over" className={`${TONE.champagne} lg:col-span-3 ${FOCUS}`}>
          <Head n="05" label="Over" />
          <div className="mt-10 flex items-end justify-between gap-6">
            <div>
              <h3 className="font-serif text-3xl leading-tight text-stone-900">Over Belise</h3>
              <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-primary/65">
                Maak kennis met de zaak en de persoon erachter.
              </p>
            </div>
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ring-taupe/30 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none">
              <Image
                src="/assets/Front/Clean%20front%20picture.jpg"
                alt=""
                fill
                sizes="5rem"
                className="object-cover"
              />
            </div>
          </div>
        </Link>

        {/* 06 Contact */}
        <Link href="/contact" className={`${TONE.ivory} lg:col-span-3 ${FOCUS}`}>
          <Head n="06" label="Contact" />
          <div className="mt-10">
            <h3 className="font-serif text-3xl leading-tight text-stone-900">Contact &amp; route</h3>
            <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-primary/65">
              Bel, stuur een bericht of bekijk de kaart. Nanovestraat 71, Opwijk.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
