import type { Metadata } from 'next';
import { CONTENT_UPDATED, SITE_NAME, absoluteUrl } from '@/lib/site';

const OG_IMAGE = { url: '/assets/Front/Clean%20front%20picture.jpg', alt: 'Belise Beauty, beautysalon in Opwijk' };

/** Metadata per pagina: canonical, Open Graph, datums. */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'nl_BE',
      siteName: SITE_NAME,
      url: absoluteUrl(path),
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
    other: { 'article:modified_time': CONTENT_UPDATED, 'last-modified': CONTENT_UPDATED },
  };
}
