import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, MapPin } from 'lucide-react';
import { SALON } from '@/lib/salon';

export const metadata: Metadata = {
  title: 'Afspraak bevestigd | Belise',
  robots: { index: false },
};

export default function BookingSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-canvas">
        <Check size={28} aria-hidden="true" />
      </span>

      <p className="mt-10 text-xs font-medium uppercase tracking-[0.3em] text-primary/55">
        Afspraak bevestigd
      </p>
      <h1 className="mt-5 font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
        Tot binnenkort bij {SALON.name}
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-primary/70">
        Je tijdslot staat vast. In je mailbox vind je de bevestiging met een kalenderbestand en
        parkeerinstructies.
      </p>

      <div className="mt-12 w-full rounded-3xl bg-card p-8 text-left shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25">
        <p className="flex items-start gap-3 text-sm text-primary">
          <MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="block font-medium">{SALON.address.street}</span>
            <span className="block text-primary/70">{SALON.address.postalCity}</span>
          </span>
        </p>
        <p className="mt-5 text-sm leading-relaxed text-primary/70">{SALON.parking}</p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center justify-center rounded-full border border-primary/25 px-8 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:border-primary hover:bg-blush/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe motion-reduce:transition-none"
      >
        Terug naar de website
      </Link>
    </main>
  );
}