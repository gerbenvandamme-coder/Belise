import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Gloock, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarbleBackground from '@/components/MarbleBackground';
import JsonLd from '@/components/JsonLd';
import { businessSchema, websiteSchema } from '@/lib/structuredData';
import { CONTENT_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// Gloock: hoog-contrast display-serif die aansluit bij het Belise-logo. Eén gewicht (400).
const serif = Gloock({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

// Gloock heeft geen cursief. Cursieve accentwoorden in koppen gebruiken Playfair Display Italic.
const accent = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-accent',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Geen zoom op mobiel: de pagina is er al leesbaar en een formulier mag niet inzoomen bij het typen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Belise Beauty | Beautysalon in Opwijk – nagels, ontharing en haar',
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Beauty',
  keywords: ['beautysalon Opwijk', 'gelnagels Opwijk', 'BIAB Opwijk', 'nagelstudio Opwijk', 'ontharing Opwijk', 'kapper Opwijk', 'Belise'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'nl_BE',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Belise Beauty | Beautysalon in Opwijk',
    description: SITE_DESCRIPTION,
    images: [{ url: '/assets/Front/Clean%20front%20picture.jpg', alt: 'Belise Beauty, beautysalon in Opwijk' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  other: { 'article:modified_time': CONTENT_UPDATED, 'last-modified': CONTENT_UPDATED },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'Belise', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl-BE" className={`${serif.variable} ${accent.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-clip bg-canvas font-sans text-primary antialiased">
        <JsonLd data={{ '@context': 'https://schema.org', '@graph': [businessSchema(), websiteSchema()] }} />
        <MarbleBackground />
        <AnnouncementBanner />
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}