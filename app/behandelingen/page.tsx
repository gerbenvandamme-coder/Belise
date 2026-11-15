import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { offerCatalogSchema, pageSchema } from '@/lib/structuredData';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Ornament from '@/components/Ornament';
import PageHeader from '@/components/PageHeader';
import TreatmentMenu from '@/components/TreatmentMenu';
import { fetchTreatmentCategories } from '@/lib/services';
import { createPublicSupabase } from '@/lib/supabasePublic';
import { TREATMENT_CATEGORIES, visibleCategories } from '@/lib/treatments';

const TITLE = 'Behandelingen & tarieven | Belise Beauty Opwijk';
const DESCRIPTION =
  'Prijslijst van Belise in Opwijk: gelnagels, BIAB, ontharing met wax en haarverzorging (snit, kleuring, brushing), met prijs en duur per behandeling.';

const PATH = '/behandelingen';
const TYPE = 'WebPage';

export const metadata: Metadata = pageMetadata(PATH, TITLE, DESCRIPTION);

// Tarieven komen uit /admin en worden elke minuut ververst.
export const revalidate = 60;

export default async function TreatmentsPage() {
  const client = createPublicSupabase();
  const categories = visibleCategories(
    client ? await fetchTreatmentCategories(client) : TREATMENT_CATEGORIES,
  );

  return (
    <main className="flex-1">
      <JsonLd data={pageSchema({ path: PATH, name: TITLE, description: DESCRIPTION, type: TYPE })} />
      <JsonLd data={offerCatalogSchema(categories)} />
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <PageHeader
          eyebrow="Behandelingen & tarieven"
          title={
            <>
              Zorg die bij <span className="italic text-accent">jou</span> past
            </>
          }
        >
          <p>
            Klap een categorie open en kies je behandeling. De prijzen zijn richtprijzen: de
            definitieve prijs hangt af van lengte, design en eventuele verwijdering van een oude set.
          </p>
        </PageHeader>

        <TreatmentMenu categories={categories} eager />
      </section>

      <Ornament className="px-6" />

      <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
        <p className="font-serif text-2xl leading-snug text-stone-900 sm:text-3xl">
          Twijfel je welke behandeling bij je past?
        </p>
        <p className="mt-3 text-[15px] text-primary/65">
          Stuur een berichtje of boek gewoon: Belise denkt graag met je mee.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent"
          >
            Afspraak maken
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-primary/25 px-6 py-3 text-[13px] font-medium text-primary transition-colors hover:border-primary hover:bg-blush/50"
          >
            Contact opnemen
          </Link>
        </div>
      </section>
    </main>
  );
}
