import Image from 'next/image';
import Link from 'next/link';
import { Palette } from 'lucide-react';
import HomeCrossroads from '@/components/HomeCrossroads';
import JsonLd from '@/components/JsonLd';
import Ornament from '@/components/Ornament';
import { pageSchema } from '@/lib/structuredData';
import { SITE_DESCRIPTION } from '@/lib/site';
import { TREATMENT_CATEGORIES, visibleCategories } from '@/lib/treatments';
import { fetchTreatmentCategories } from '@/lib/services';
import { loadCutouts } from '@/lib/showcase';
import { createPublicSupabase } from '@/lib/supabasePublic';

// Tarieven worden elke minuut opnieuw opgehaald, zodat wijzigingen in /admin snel zichtbaar zijn.
export const revalidate = 60;

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:active:scale-100';

export default async function HomePage() {
  const client = createPublicSupabase();
  const categories = visibleCategories(
    client ? await fetchTreatmentCategories(client) : TREATMENT_CATEGORIES,
  );

  return (
    <main id="top" className="flex-1">
      <JsonLd data={pageSchema({ path: '/', name: 'Belise Beauty – beautysalon in Opwijk', description: SITE_DESCRIPTION })} />
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Beautysalon · Opwijk
        </p>
        <div className="mt-6 grid items-center gap-10 lg:mt-2 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <h1 className="relative isolate max-w-full font-serif leading-none text-stone-900">
            {/* Zachte lichte waas achter de titel, zodat de marmeraders het logo niet doorkruisen. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-[50%] bg-canvas/70 blur-2xl"
            />
            <Image
              src="/brand/belise-wordmark-hero.png"
              alt="Belise"
              width={1852}
              height={648}
              priority
              sizes="(min-width: 1024px) 30rem, 70vw"
              className="block h-auto w-[clamp(15rem,62vw,30rem)] select-none"
              draggable={false}
            />
            <span className="mt-3 block pl-[0.35em] text-[length:clamp(2rem,6vw,4.75rem)] font-normal italic leading-none tracking-[0.01em] text-accent">
              Beauty
            </span>
            <span className="sr-only"> – beautysalon in Opwijk voor nagels, ontharing en haarverzorging</span>
          </h1>

          <figure className="relative mx-auto mt-8 w-full max-w-[19rem] sm:max-w-sm lg:ml-auto lg:mr-6 lg:mt-12 lg:max-w-[22rem]">
            <div className="relative">
            {/* Verschoven kaderlijn achter de foto */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-taupe/70 sm:translate-x-5 sm:translate-y-5"
            />
            <div className="shadow-luxe-lg relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] ring-1 ring-taupe/30">
              {/* De foto is iets uitvergroot, verankerd onderaan, zodat de uitsnede hieronder exact meeschaalt. */}
              <div
                className="absolute inset-x-0 top-[-21.7%] aspect-[1536/2752] origin-bottom scale-[1.12]"
              >
                <Image
                  src="/assets/Front/Clean%20front%20picture.jpg"
                  alt="Zaakvoerder van Belise"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/40"
              />
            </div>
            {/* Dezelfde foto, uitgeknipt: hoofd en schouders steken boven het kader uit. Onderaan blijft het afgesneden. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [clip-path:inset(-30%_-12%_0_-12%_round_0_0_2rem_2rem)]"
            >
              <div className="absolute inset-x-0 top-[-21.7%] aspect-[1536/2752] origin-bottom scale-[1.12]">
                <Image
                  src="/assets/Front/front-cutout.webp"
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="select-none object-cover"
                  draggable={false}
                />
              </div>
            </div>
            </div>
            <figcaption className="mt-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/55">
              <span aria-hidden="true" className="hairline h-px flex-1" />
              Jouw beauty-adres in Opwijk
              <span aria-hidden="true" className="hairline h-px flex-1" />
            </figcaption>
          </figure>
        </div>

        <div className="mt-10 lg:mt-12">
          <div className="max-w-2xl">
            <p className="max-w-lg text-base leading-relaxed text-primary/70 sm:text-lg">
              Bij Belise nemen we de tijd voor jou. Van nagels en ontharing tot snit, kleur en
              brushing: elke behandeling wordt afgestemd op jouw stijl en je dagelijkse
              leven.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/booking"
                className={`${buttonBase} bg-primary text-canvas shadow-sm hover:bg-accent hover:shadow-md`}
              >
                Afspraak maken
              </Link>
              <Link
                href="/designer"
                className={`${buttonBase} border border-primary/25 text-primary hover:border-primary hover:bg-blush/50`}
              >
                <Palette size={16} aria-hidden="true" />
                Ontwerp je nagels
              </Link>
            </div>

            <ul className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-taupe/40 border-y border-taupe/30 py-4 text-center">
              {[
                ['Op afspraak', 'Persoonlijke aandacht'],
                ['Online boeken', 'Wanneer het jou past'],
                ['Opwijk', 'Nanovestraat 71'],
              ].map(([title, detail]) => (
                <li key={title} className="px-3">
                  <span className="block font-serif text-base italic text-primary">{title}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-primary/50">
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Ornament className="px-6" />

      <HomeCrossroads categoryTitles={categories.map((category) => category.title)} cutouts={loadCutouts()} />
    </main>
  );
}