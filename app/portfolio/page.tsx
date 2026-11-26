import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';
import PageHeader from '@/components/PageHeader';
import PortfolioGallery from '@/components/PortfolioGallery';
import { fetchPortfolio, fetchPortfolioFrames, NO_FRAMES, type PortfolioEntry } from '@/lib/portfolio';
import { loadCutouts } from '@/lib/showcase';
import { createPublicSupabase } from '@/lib/supabasePublic';

const TITLE = 'Portfolio | Belise Beauty Opwijk';
const DESCRIPTION =
  'Recent werk van Belise in Opwijk: gelnagels, nail art en haarverzorging, te filteren op stijl zoals French of chroom.';

const PATH = '/portfolio';
const TYPE = 'CollectionPage';

export const metadata: Metadata = pageMetadata(PATH, TITLE, DESCRIPTION);

// Nieuwe foto's uit /admin verschijnen binnen een minuut.
export const revalidate = 60;

export default async function PortfolioPage() {
  const client = createPublicSupabase();
  const [entries, frames] = client
    ? await Promise.all([fetchPortfolio(client), fetchPortfolioFrames(client)])
    : [[] as PortfolioEntry[], { ...NO_FRAMES }];

  // Zolang er nog geen nagelfoto's in het portfolio staan, tonen we de showcase-sets.
  const hasNails = entries.some((entry) => entry.categoryId === 'nails');
  const fallbackNails: PortfolioEntry[] = hasNails
    ? []
    : loadCutouts().map((cutout, index) => ({
        id: `showcase-${index}`,
        categoryId: 'nails',
        src: cutout.src,
        title: cutout.name,
        tags: [],
        cutout: true,
      }));

  return (
    <main className="flex-1">
      <JsonLd data={pageSchema({ path: PATH, name: TITLE, description: DESCRIPTION, type: TYPE })} />
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-12 lg:px-8 lg:pb-24 lg:pt-16">
        <PageHeader
          eyebrow="Portfolio"
          title={
            <>
              Werk met <span className="italic text-accent">aandacht</span> voor detail
            </>
          }
        >
          <p>Blader per behandeling door recente resultaten. Filter op stijl met de labels.</p>
        </PageHeader>

        <PortfolioGallery entries={[...entries, ...fallbackNails]} frames={frames} />
      </section>
    </main>
  );
}
