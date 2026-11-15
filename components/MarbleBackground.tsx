import type { CSSProperties } from 'react';

const BACKGROUND = {
  desktopWebp: '/assets/Background/background_desktop.webp',
  mobileWebp: '/assets/Background/background_mobile.webp',
  desktopJpg: '/assets/Background/background_desktop.jpg',
  mobileJpg: '/assets/Background/background_mobile.jpg',
  surface: '#F9F8F6',
  mobileQuery: '(max-width: 640px)',
} as const;

const wrapperStyle: CSSProperties = {
  zIndex: -1,
  backgroundColor: BACKGROUND.surface,
};

/**
 * Vaste marmerachtergrond met een heel trage, subtiele beweging:
 * - de steen "ademt" (minieme verschuiving en zoom over ~50 s);
 * - op grotere schermen glijdt een zachte lichtglans over het marmer.
 * Enkel transform en opacity worden geanimeerd (GPU), dus geen layout-werk per frame.
 * Bij "minder beweging" in het besturingssysteem staat alles stil (zie globals.css).
 */
export default function MarbleBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden [contain:strict]"
      style={wrapperStyle}
    >
      <picture className="marble-drift block h-full w-full">
        <source media={BACKGROUND.mobileQuery} srcSet={BACKGROUND.mobileWebp} type="image/webp" />
        <source media={BACKGROUND.mobileQuery} srcSet={BACKGROUND.mobileJpg} />
        <source srcSet={BACKGROUND.desktopWebp} type="image/webp" />
        <img
          src={BACKGROUND.desktopJpg}
          alt=""
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="marble-sheen absolute inset-y-0 -left-1/2 hidden w-[200%] md:block" />
    </div>
  );
}
