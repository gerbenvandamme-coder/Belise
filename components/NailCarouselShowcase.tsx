import NailCarouselClient from './NailCarouselClient';
import { loadCutouts } from '@/lib/showcase';

/** Nieuwe PNG's in public/assets/showcase_cutouts/ verschijnen na een nieuwe build. */
export default function NailCarouselShowcase() {
  return <NailCarouselClient items={loadCutouts()} />;
}
