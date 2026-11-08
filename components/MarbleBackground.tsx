'use client';

import type { CSSProperties } from 'react';

const BACKGROUND = {
  desktop: '/assets/Background/background_desktop.jpg',
  mobile: '/assets/Background/background_mobile.jpg',
  surface: '#F9F8F6',
  mobileQuery: '(max-width: 640px)',
} as const;

const wrapperStyle: CSSProperties = {
  zIndex: -1,
  backgroundColor: BACKGROUND.surface,
};

export default function MarbleBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={wrapperStyle}
    >
      <picture className="block h-full w-full">
        <source media={BACKGROUND.mobileQuery} srcSet={BACKGROUND.mobile} />
        <img
          src={BACKGROUND.desktop}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      </picture>
    </div>
  );
}