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
    icons: [],
  };
}