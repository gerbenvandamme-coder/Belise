// Gedeelde classes voor het admin panel. Minimaal 48px (min-h-12) voor alle bedieningselementen.
export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const CONTROL_BASE = `inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;

export const BUTTON_PRIMARY = `${CONTROL_BASE} bg-accent text-white hover:bg-accent-dark`;

export const BUTTON_SECONDARY = `${CONTROL_BASE} border border-taupe/50 bg-card text-primary hover:bg-canvas`;

export const INPUT_CLASS =
  'min-h-12 w-full rounded-2xl border border-taupe/50 bg-canvas px-4 text-base text-primary placeholder:text-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const CARD_CLASS = 'rounded-3xl border border-taupe/40 bg-card p-5 shadow-sm';

export const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark';