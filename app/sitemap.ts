import type { MetadataRoute } from 'next';
import { CONTENT_UPDATED, PUBLIC_PAGES, absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: new Date(CONTENT_UPDATED),
    changeFrequency: page.priority >= 0.9 ? 'weekly' : 'monthly',
    priority: page.priority,
  }));
}
