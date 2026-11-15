import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarbleBackground from '@/components/MarbleBackground';
import './globals.css';

// Playfair Display: elegante, warme luxe-serif met echte cursief. Variabel gewicht (400-900).
const serif = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Belise | Beautysalon',
  description:
    'Belise is een beautysalon in Opwijk voor nagels, ontharing en haarverzorging. Boek online je afspraak.',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'Belise', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-clip bg-canvas font-sans text-primary antialiased">
        <MarbleBackground />
        <AnnouncementBanner />
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}