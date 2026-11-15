import type { ReactNode } from 'react';

/** Kop voor een aparte pagina: label met lijntje, titel en korte intro. */
export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="reveal max-w-2xl">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        {eyebrow}
      </p>
      <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-stone-900 sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      {children && (
        <div className="mt-5 text-[15px] leading-relaxed text-primary/70">{children}</div>
      )}
    </header>
  );
}
