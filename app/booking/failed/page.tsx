import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bevestigen niet gelukt | Belise',
  robots: { index: false },
};

type FailedPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function BookingFailedPage({ searchParams }: FailedPageProps) {
  const { reason } = await searchParams;
  const expired = reason === 'expired';

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-primary">
        <Clock size={28} aria-hidden="true" />
      </span>

      <h1 className="mt-10 font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
        {expired ? 'Je reservering is vervallen' : 'Deze link werkt niet'}
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-primary/70">
        {expired
          ? 'Je hebt niet binnen 15 minuten bevestigd, dus is het tijdslot weer vrijgegeven. Je kunt een nieuwe afspraak maken.'
          : 'We vinden geen openstaande afspraak bij deze link. Controleer of je de nieuwste e-mail gebruikt, of maak een nieuwe afspraak.'}
      </p>

      <Link
        href="/#behandelingen"
        className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-canvas shadow-sm transition-colors duration-200 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe motion-reduce:transition-none"
      >
        Nieuwe afspraak maken
      </Link>
    </main>
  );
}