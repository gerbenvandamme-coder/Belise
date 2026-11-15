import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';

const TITLE = 'Nageldesigner | Belise – test je nagels online';
const DESCRIPTION =
  'Ontwerp je nagels online op een echte hand: kies vorm, lengte, kleur, finish en nail art, en boek het ontwerp meteen bij Belise in Opwijk.';

export const metadata: Metadata = pageMetadata('/designer', TITLE, DESCRIPTION);

export default function DesignerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={pageSchema({
          path: '/designer',
          name: TITLE,
          description: DESCRIPTION,
          extra: {
            mainEntity: {
              '@type': 'WebApplication',
              name: 'Belise Nageldesigner',
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
            },
          },
        })}
      />
      {children}
    </>
  );
}
