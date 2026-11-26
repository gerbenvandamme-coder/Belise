'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/supabaseStorage';
import { PORTFOLIO_BUCKET } from '@/lib/portfolio';
import {
  DEFAULT_HERO_CUTOUT,
  DEFAULT_HERO_PHOTO,
  SITE_KEYS,
  parseSalonPhotos,
  storagePublicUrl,
} from '@/lib/siteContent';
import { ABOUT, isFilledIn } from '@/lib/salon';
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD_CLASS,
  FOCUS_RING,
  INPUT_CLASS,
  SECTION_LABEL,
} from '@/lib/admin/ui';

type Settings = Record<string, string>;

const MAX_SALON_PHOTOS = 6;

async function uploadSitePhoto(file: File, keepAlpha = false): Promise<string> {
  const blob = await compressImage(file, { keepAlpha });
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `site/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw new Error('Upload mislukt. Probeer opnieuw.');
  return path;
}

async function removeSitePhoto(path: string | undefined) {
  if (path && path.startsWith('site/')) await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
}

const photoUrl = (path: string) => storagePublicUrl(supabase, path);

/** Beheer van de teksten en foto's op de homepage en de Over-pagina. */
export default function WebsiteTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SITE_KEYS))
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Instellingen laden mislukt.');
          return;
        }
        setSettings(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(values: Settings): Promise<boolean> {
    const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
    const { error: saveError } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (saveError) return false;
    setSettings((current) => ({ ...(current ?? {}), ...values }));
    return true;
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!settings) return <p className="text-sm text-primary/70">Laden…</p>;

  return (
    <div className="space-y-10">
      <p className="text-sm leading-relaxed text-primary/70">
        Wijzigingen staan binnen een minuut op de website.
      </p>
      <AboutTextSection settings={settings} onSave={save} />
      <HeroPhotoSection settings={settings} onSave={save} />
      <SalonPhotosSection settings={settings} onSave={save} />
    </div>
  );
}

type SectionProps = { settings: Settings; onSave: (values: Settings) => Promise<boolean> };

function AboutTextSection({ settings, onSave }: SectionProps) {
  const [name, setName] = useState(
    settings[SITE_KEYS.ownerName] ?? (isFilledIn(ABOUT.ownerName) ? ABOUT.ownerName : ''),
  );
  const [story, setStory] = useState(settings[SITE_KEYS.story] ?? ABOUT.story.join('\n\n'));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const ok = await onSave({
      [SITE_KEYS.ownerName]: name.trim(),
      [SITE_KEYS.story]: story.trim(),
    });
    setSaving(false);
    setStatus(ok ? 'Opgeslagen.' : 'Opslaan mislukt. Probeer opnieuw.');
  }

  return (
    <section aria-labelledby="about-heading" className="space-y-3">
      <h2 id="about-heading" className={SECTION_LABEL}>
        Pagina &quot;Over&quot;
      </h2>
      <form onSubmit={handleSubmit} className={`${CARD_CLASS} space-y-4`}>
        <label className="block text-sm text-primary/80">
          Je naam zoals op de site
          <input
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>
        <label className="block text-sm text-primary/80">
          Je verhaal
          <textarea
            rows={8}
            maxLength={3000}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            placeholder="Wie ben je, hoe ben je begonnen, waar hou je van in je vak? Laat een lege regel tussen twee alinea's."
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>
        <p className="text-xs text-primary/55">Laat een lege regel tussen twee alinea&apos;s.</p>
        {status && (
          <p role="status" className="text-sm text-primary/80">
            {status}
          </p>
        )}
        <button type="submit" disabled={saving} className={`${BUTTON_PRIMARY} w-full`}>
          {saving ? 'Opslaan…' : 'Tekst opslaan'}
        </button>
      </form>
    </section>
  );
}

function HeroPhotoSection({ settings, onSave }: SectionProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [cutout, setCutout] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentPhoto = settings[SITE_KEYS.heroPhoto];
  const currentCutout = settings[SITE_KEYS.heroCutout];
  const preview = currentPhoto ? photoUrl(currentPhoto) : DEFAULT_HERO_PHOTO;
  const previewCutout = currentPhoto ? (currentCutout ? photoUrl(currentCutout) : null) : DEFAULT_HERO_CUTOUT;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      setStatus('Kies eerst een foto.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const photoPath = await uploadSitePhoto(photo);
      const cutoutPath = cutout ? await uploadSitePhoto(cutout, true) : '';
      const ok = await onSave({
        [SITE_KEYS.heroPhoto]: photoPath,
        [SITE_KEYS.heroCutout]: cutoutPath,
        [SITE_KEYS.aboutPhoto]: photoPath,
      });
      if (!ok) throw new Error('Opslaan mislukt. Probeer opnieuw.');
      await removeSitePhoto(currentPhoto);
      await removeSitePhoto(currentCutout);
      setPhoto(null);
      setCutout(null);
      (event.target as HTMLFormElement).reset();
      setStatus('Nieuwe foto staat op de site.');
    } catch (uploadError) {
      setStatus(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.');
    } finally {
      setBusy(false);
    }
  }

  async function resetToDefault() {
    setBusy(true);
    const ok = await onSave({
      [SITE_KEYS.heroPhoto]: '',
      [SITE_KEYS.heroCutout]: '',
      [SITE_KEYS.aboutPhoto]: '',
    });
    if (ok) {
      await removeSitePhoto(currentPhoto);
      await removeSitePhoto(currentCutout);
    }
    setBusy(false);
    setStatus(ok ? 'De oorspronkelijke foto staat terug.' : 'Opslaan mislukt.');
  }

  return (
    <section aria-labelledby="hero-heading" className="space-y-3">
      <h2 id="hero-heading" className={SECTION_LABEL}>
        Foto van jezelf (homepage en Over)
      </h2>
      <form onSubmit={handleSubmit} className={`${CARD_CLASS} space-y-4`}>
        <div className="relative mx-auto aspect-[4/5] w-40 overflow-hidden rounded-2xl bg-canvas ring-1 ring-taupe/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Huidige foto" className="h-full w-full object-cover" />
          {previewCutout && (
            <span className="absolute bottom-2 left-2 rounded-full bg-primary/80 px-2 py-0.5 text-[10px] text-canvas">
              met uitsnede
            </span>
          )}
        </div>
        <label className="block text-sm text-primary/80">
          Nieuwe foto (staand, JPG of WebP)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className={`mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent-dark ${FOCUS_RING}`}
          />
        </label>
        <label className="block text-sm text-primary/80">
          Uitgeknipte versie (optioneel, PNG zonder achtergrond)
          <input
            type="file"
            accept="image/png,image/webp"
            onChange={(event) => setCutout(event.target.files?.[0] ?? null)}
            className={`mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent-dark ${FOCUS_RING}`}
          />
        </label>
        <p className="text-xs leading-relaxed text-primary/55">
          Met een uitgeknipte versie van dezelfde foto steken je hoofd en schouders boven het kader
          uit, zoals nu. Zonder uitsnede staat de foto gewoon in het kader. De ontwikkelaar kan de
          uitsnede ook voor je maken.
        </p>
        {status && (
          <p role="status" className="text-sm text-primary/80">
            {status}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${BUTTON_PRIMARY} w-full gap-2`}>
          <ImagePlus size={16} aria-hidden="true" />
          {busy ? 'Bezig…' : 'Foto vervangen'}
        </button>
        {currentPhoto && (
          <button type="button" disabled={busy} onClick={() => void resetToDefault()} className={`${BUTTON_SECONDARY} w-full`}>
            Oorspronkelijke foto terugzetten
          </button>
        )}
      </form>
    </section>
  );
}

function SalonPhotosSection({ settings, onSave }: SectionProps) {
  const paths = parseSalonPhotos(settings[SITE_KEYS.salonPhotos]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(file: File | null) {
    if (!file) return;
    if (paths.length >= MAX_SALON_PHOTOS) {
      setStatus(`Maximaal ${MAX_SALON_PHOTOS} foto's.`);
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const path = await uploadSitePhoto(file);
      const ok = await onSave({ [SITE_KEYS.salonPhotos]: JSON.stringify([...paths, path]) });
      if (!ok) {
        await removeSitePhoto(path);
        throw new Error('Opslaan mislukt.');
      }
      setStatus('Foto toegevoegd.');
    } catch (uploadError) {
      setStatus(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(path: string) {
    setBusy(true);
    const ok = await onSave({ [SITE_KEYS.salonPhotos]: JSON.stringify(paths.filter((item) => item !== path)) });
    if (ok) await removeSitePhoto(path);
    setBusy(false);
    setStatus(ok ? 'Foto verwijderd.' : 'Verwijderen mislukt.');
  }

  return (
    <section aria-labelledby="salon-heading" className="space-y-3">
      <h2 id="salon-heading" className={SECTION_LABEL}>
        Foto&apos;s van de salon (&quot;Een kijkje binnen&quot;)
      </h2>
      <div className={`${CARD_CLASS} space-y-4`}>
        {paths.length === 0 && (
          <p className="text-sm text-primary/70">Nog geen foto&apos;s. Tot dan toont de pagina een korte tekst.</p>
        )}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {paths.map((path) => (
            <li key={path} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(path)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Foto verwijderen"
                disabled={busy}
                onClick={() => void remove(path)}
                className={`absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-primary ${FOCUS_RING}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <label className={`${BUTTON_SECONDARY} w-full cursor-pointer gap-2 ${busy ? 'opacity-50' : ''}`}>
          <ImagePlus size={16} aria-hidden="true" />
          {busy ? 'Bezig…' : 'Foto toevoegen'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              void add(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </label>
        {status && (
          <p role="status" className="text-sm text-primary/80">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
