import { AtSign, MapPin } from 'lucide-react';
import { SALON } from '@/lib/salon';

const ADDRESS_LINE = `${SALON.address.street}, ${SALON.address.postalCity}`;
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_LINE)}`;

const LINK_CLASS =
  'inline-flex items-center gap-2 rounded-full px-2 py-1 text-primary transition-colors hover:bg-blush/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';

export default function SalonLocationBadge() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blush/30 px-5 py-3 text-sm">
      <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        <MapPin size={16} aria-hidden="true" />
        <span>{ADDRESS_LINE}</span>
      </a>
      <a
        href={SALON.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        <AtSign size={16} aria-hidden="true" />
        <span>{SALON.instagram.handle}</span>
      </a>
    </div>
  );
}