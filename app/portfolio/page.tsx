import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PortfolioGallery from '@/components/PortfolioGallery';
import { fetchPortfolio, type PortfolioEntry } from '@/lib/portfolio';
import { loadCutouts } from '@/lib/showcase';
import { createPublicSupabase } from '@/lib/supabasePublic';

export const metadata: Metadata = {
  title: 'Portfolio | Belise',
  description: 'Werk van Belise: nagels, haarverzorging en meer.',
};

// Nieuwe foto's uit /admin verschijnen binnen een minuut.
export const revalidate = 60;

export default async function PortfolioPage() {
  const client = createPublicSupabase();
  const entries = client ? await fetchPortfolio(client) : [];

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

        <PortfolioGallery entries={[...entries, ...fallbackNails]} />
      </section>
    </main>
  );
}
