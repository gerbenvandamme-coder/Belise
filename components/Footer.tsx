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
            Beautysalon voor make-up, haar, nagels en behandelingen voor handen en voeten, met
            aandacht voor elk detail.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            <Clock size={16} aria-hidden="true" className="text-accent" />
            Openingstijden
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-primary/80">
            {SALON.hours.map((entry) => (
              <li key={entry.day} className="flex justify-between gap-6">
                <span>{entry.day}</span>
                <span>{entry.time}</span>
              </li>
            ))}
          </ul>
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
        <p className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-primary/60 lg:px-8">
          © {year} {SALON.name}. Alle rechten voorbehouden.
        </p>
      </div>
    </footer>
  );
}