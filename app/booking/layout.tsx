import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';

const TITLE = 'Afspraak maken | Belise Beauty Opwijk';
const DESCRIPTION =
  'Boek online een afspraak bij Belise in Opwijk: kies je behandeling en een vrij moment in de agenda.';

export const metadata: Metadata = pageMetadata('/booking', TITLE, DESCRIPTION);

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={pageSchema({ path: '/booking', name: TITLE, description: DESCRIPTION })} />
      {children}
    </>
  );
}
