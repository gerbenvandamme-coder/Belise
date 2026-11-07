'use client';

import { useRef, useState } from 'react';
import { Download, MessageCircle, X } from 'lucide-react';
import NailCanvas from '@/components/NailCanvas';
import NailControls, {
  DEFAULT_NAIL_CONFIG,
  FINISH_OPTIONS,
  NAIL_LENGTHS,
  NAIL_SHAPES,
  PATTERN_OPTIONS,
  type NailConfig,
} from '@/components/NailControls';

const DOWNLOAD_FILE_NAME = 'belise-manicure-ontwerp.png';
/** Zonder nummer opent wa.me de WhatsApp-keuze, zodat de klant zelf het salon-contact kiest. */
const WHATSAPP_URL = 'https://wa.me/';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const ACTION_BUTTON = `inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${FOCUS_RING}`;

type SummaryRow = { label: string; value: string };

function findLabel(items: readonly { id: string; label: string }[], id: string): string {
  return items.find((item) => item.id === id)?.label ?? id;
}

function describeArt(config: NailConfig): string {
  const pattern = findLabel(PATTERN_OPTIONS, config.pattern);
  if (!config.accentRingOnly) return pattern;
  return config.pattern === 'solid'
    ? 'Accentnagel (ringvinger), effen'
    : `Accentnagel (ringvinger): ${pattern}`;
}

/** Alleen de accentkleur wordt getoond als die ook daadwerkelijk op de nagels terugkomt. */
function buildSummary(config: NailConfig): SummaryRow[] {
  const usesAccent = config.pattern !== 'solid' || config.accentRingOnly;

  return [
    { label: 'Vorm', value: findLabel(NAIL_SHAPES, config.shape) },
    { label: 'Lengte', value: findLabel(NAIL_LENGTHS, config.length) },
    { label: 'Kleur', value: config.baseColor.toUpperCase() },
    ...(usesAccent ? [{ label: 'Accentkleur', value: config.accentColor.toUpperCase() }] : []),
    { label: 'Finish', value: findLabel(FINISH_OPTIONS, config.finish) },
    { label: 'Nail art', value: describeArt(config) },
  ];
}

function buildWhatsAppUrl(rows: readonly SummaryRow[]): string {
  const details = rows.map((row) => `${row.label}: ${row.value}`).join(', ');
  const message = `Hallo Belise, ik wil graag een afspraak maken voor deze manicure: [${details}]`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

function SummaryCard({ rows }: { rows: readonly SummaryRow[] }) {
  return (
    <dl className="divide-y divide-taupe/30 rounded-2xl ring-1 ring-taupe/25">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
          <dt className="text-primary/60">{row.label}</dt>
          <dd className="text-right font-medium text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function DesignerPage() {
  const [config, setConfig] = useState<NailConfig>(DEFAULT_NAIL_CONFIG);
  const previewRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const summary = buildSummary(config);
  const whatsappUrl = buildWhatsAppUrl(summary);

  const handleDownload = () => {
    const canvas = previewRef.current?.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = DOWNLOAD_FILE_NAME;
    link.click();
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Nagel Designer
        </p>
        <h1 className="mt-5 font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl">
          Test je <span className="italic text-accent">ideale</span> set
        </h1>
        <p className="mt-6 text-base leading-relaxed text-primary/70">
          Kies vorm, lengte, kleur en finish en zie direct het resultaat. Daarna kun je de set
          bespreken tijdens je afspraak.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section
          ref={previewRef}
          aria-label="Voorbeeld van je nagels"
          className="rounded-3xl bg-card p-6 shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25 sm:p-10 lg:sticky lg:top-28"
        >
          <NailCanvas
            shape={config.shape}
            length={config.length}
            baseColor={config.baseColor}
            finish={config.finish}
            pattern={config.pattern}
            accentColor={config.accentColor}
            accentRingOnly={config.accentRingOnly}
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              className={`${ACTION_BUTTON} border border-primary/25 text-primary hover:border-accent hover:bg-accent-soft hover:text-accent-dark`}
            >
              <Download size={16} aria-hidden="true" />
              Download Ontwerp
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              className={`${ACTION_BUTTON} bg-primary text-canvas shadow-sm hover:bg-accent hover:shadow-md`}
            >
              Neem mee naar afspraak
            </button>
          </div>
        </section>

        <NailControls value={config} onChange={setConfig} />
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="booking-title"
        className="m-auto w-[min(92vw,28rem)] rounded-3xl bg-card p-0 text-primary shadow-[0_30px_60px_-30px_rgba(28,25,23,0.5)] ring-1 ring-taupe/25 backdrop:bg-primary/40"
      >
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="booking-title" className="font-serif text-3xl font-light leading-tight">
              Neem mee naar afspraak
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Sluiten"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent-soft ${FOCUS_RING}`}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-primary/70">
            Laat deze samenvatting zien in de salon of stuur hem vooraf door.
          </p>

          <div className="mt-6">
            <SummaryCard rows={summary} />
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ACTION_BUTTON} mt-8 w-full bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md`}
          >
            <MessageCircle size={16} aria-hidden="true" />
            Boek deze behandeling
          </a>
        </div>
      </dialog>
    </main>
  );
}