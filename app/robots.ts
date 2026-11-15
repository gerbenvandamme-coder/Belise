import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const PRIVATE = ['/admin', '/account', '/auth', '/booking/success', '/booking/failed'];

/** Zoekmachines en AI-assistenten mogen de publieke pagina's lezen; accounts en beheer niet. */
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot',
    'Applebot-Extended',
    'Bingbot',
    'CCBot',
    'meta-externalagent',
    'DuckAssistBot',
  ];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      ...aiBots.map((userAgent) => ({ userAgent, allow: ['/', '/llms.txt', '/llms-full.txt'], disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
