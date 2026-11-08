import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarbleBackground from '@/components/MarbleBackground';
import './globals.css';

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
  title: 'Belise | Beautysalon',
  description:
    'Belise is een beautysalon voor make-up, haar, nagels en behandelingen voor handen en voeten.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-primary antialiased">
        <MarbleBackground />
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}