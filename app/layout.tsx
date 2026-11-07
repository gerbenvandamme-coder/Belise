import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Cormorant_Garamond,
  Fraunces,
  Great_Vibes,
  Plus_Jakarta_Sans,
  Yeseva_One,
} from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-display',
  display: 'swap',
});

const headline = Yeseva_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-headline',
  display: 'swap',
});

const script = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
  title: 'Belise | Nagelsalon',
  description: 'Belise is een nagelsalon voor verfijnde behandelingen en persoonlijke nagelkunst.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${display.variable} ${headline.variable} ${script.variable} ${serif.variable} ${sans.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-primary antialiased">
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}