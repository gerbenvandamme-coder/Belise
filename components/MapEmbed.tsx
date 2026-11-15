'use client';

import { useState } from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

const LINK =
  'inline-flex items-center gap-2 rounded-full border border-taupe/50 px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:border-accent/40 hover:text-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Kleine Google Maps-kaart. De kaart wordt pas geladen na een klik, zodat er niets naar Google gaat
 * zolang bezoekers de kaart niet willen zien (AVG). De knoppen eronder openen Google Maps of
 * Apple Maps in de app van het toestel, voor de route.
 */
export default function MapEmbed({ street, postalCity }: { street: string; postalCity: string }) {
  const [loaded, setLoaded] = useState(false);
  const address = `${street}, ${postalCity}, België`;
  const query = encodeURIComponent(address);

  return (
    <div>
      <div className="shadow-luxe relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-taupe/30 sm:aspect-[16/10]">
        {loaded ? (
          <iframe
            title={`Kaart van ${street}, ${postalCity}`}
            src={`https://www.google.com/maps?q=${query}&hl=nl&z=16&output=embed`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blush/40 to-card px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark ring-1 ring-accent/15">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <p className="mt-4 font-serif text-2xl text-stone-900">{street}</p>
            <p className="text-[14px] text-primary/65">{postalCity}</p>
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-canvas transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Kaart tonen
            </button>
            <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-primary/50">
              Door de kaart te laden maak je verbinding met Google. Pas dan worden er gegevens naar
              Google gestuurd.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK}
        >
          <Navigation size={14} aria-hidden="true" />
          Route in Google Maps
        </a>
        <a
          href={`https://maps.apple.com/?daddr=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK}
        >
          <ExternalLink size={14} aria-hidden="true" />
          Apple Maps
        </a>
      </div>
    </div>
  );
}
