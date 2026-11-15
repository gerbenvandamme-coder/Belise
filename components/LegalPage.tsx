import type { ReactNode } from 'react';

/** Toont een nog in te vullen waarde opvallend, zodat ze niet vergeten wordt. */
export function Fill({ children }: { children: string }) {
  if (!children.startsWith('[')) return <>{children}</>;
  return (
    <mark className="rounded bg-accent-soft px-1 py-0.5 font-medium text-accent-dark">{children}</mark>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-normal text-primary">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-primary/80 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  draft,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  draft: boolean;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 lg:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-4xl font-normal leading-tight text-primary sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-primary/55">Laatst bijgewerkt: {lastUpdated}</p>
      {draft && (
        <p
          role="note"
          className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft/60 px-5 py-4 text-sm text-accent-dark"
        >
          Concept: de gemarkeerde gegevens moeten nog worden ingevuld voordat deze tekst geldt.
        </p>
      )}
      {children}
    </main>
  );
}
