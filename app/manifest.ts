import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Belise Admin',
    short_name: 'Belise',
    description: 'Beheer van agenda, klanten, beschikbaarheid en tarieven voor Belise.',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#1C1917',
    lang: 'nl',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}