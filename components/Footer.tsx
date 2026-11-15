import Link from 'next/link';
import { Clock, Instagram, MapPin } from 'lucide-react';
import { SALON } from '@/lib/salon';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative border-t border-taupe/40 bg-card">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-serif text-2xl font-semibold tracking-[0.2em] text-primary">
            {SALON.name}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary/70">
            Beautysalon in Opwijk voor nagels, ontharing en haarverzorging, met aandacht voor elk
            detail.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            <Clock size={16} aria-hidden="true" className="text-accent" />
            Openingstijden
          </h2>
          <p className="mt-4 text-sm font-medium text-primary">Enkel op afspraak</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary/70">
            De vrije momenten vind je in de online agenda.
          </p>
          <Link
            href="/booking"
            className="mt-4 inline-flex text-sm font-medium text-accent-dark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Bekijk beschikbare momenten
          </Link>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            <MapPin size={16} aria-hidden="true" className="text-accent" />
            Adres
          </h2>
          <address className="mt-4 not-italic text-sm leading-relaxed text-primary/80">
            {SALON.address.street}
            <br />
            {SALON.address.postalCity}
          </address>

          <a
            href={SALON.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-taupe px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Instagram size={16} aria-hidden="true" className="text-accent" />
            @{SALON.instagram.handle}
          </a>
        </div>
      </div>

      <div className="border-t border-taupe/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-primary/60 sm:flex-row lg:px-8">
          <p>© {year} {SALON.name}. Alle rechten voorbehouden.</p>
          <nav aria-label="Juridisch" className="flex gap-5">
            <Link href="/algemene-voorwaarden" className="hover:text-accent-dark hover:underline">
              Algemene voorwaarden
            </Link>
            <Link href="/privacy" className="hover:text-accent-dark hover:underline">
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}