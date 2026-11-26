'use client';

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage, hasTransparency } from '@/lib/supabaseStorage';
import {
  NO_FRAMES,
  PORTFOLIO_BUCKET,
  PORTFOLIO_CATEGORIES,
  frameSettingKey,
  normalizeTag,
  parseFrames,
  type PortfolioFrames,
} from '@/lib/portfolio';
import type { PortfolioCategoryId, PortfolioItemRow } from '@/lib/database.types';
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD_CLASS,
  FOCUS_RING,
  INPUT_CLASS,
  SECTION_LABEL,
} from '@/lib/admin/ui';

const MAX_TAGS = 12;

function publicUrl(path: string): string {
  return supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Invoer voor tags: Enter of komma voegt toe, kruisje verwijdert. */
function TagEditor({
  tags,
  suggestions,
  onChange,
  disabled,
}: {
  tags: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const listId = useMemo(() => `tags-${Math.random().toString(36).slice(2)}`, []);

  const add = (raw: string) => {
    const tag = normalizeTag(raw);
    setDraft('');
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-dark"
          >
            #{tag}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              aria-label={`Tag ${tag} verwijderen`}
              className={`rounded-full p-0.5 hover:bg-accent/15 ${FOCUS_RING}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <input
        list={listId}
        value={draft}
        disabled={disabled || tags.length >= MAX_TAGS}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKey}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length >= MAX_TAGS ? 'Maximum bereikt' : 'Tag toevoegen + Enter (bv. french)'}
        className={`mt-2 ${INPUT_CLASS}`}
      />
      <datalist id={listId}>
        {suggestions
          .filter((tag) => !tags.includes(tag))
          .map((tag) => (
            <option key={tag} value={tag} />
          ))}
      </datalist>
    </div>
  );
}

type ClientOption = { id: string; name: string; consent: boolean };

/** Klant op de foto kiezen, met de status van haar fototoestemming. */
function ClientPicker({
  clients,
  value,
  onChange,
  disabled,
}: {
  clients: ClientOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selected = clients.find((client) => client.id === value) ?? null;
  return (
    <div className="space-y-2">
      <label className="block text-sm text-primary/80">
        Klant op de foto
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`mt-2 ${INPUT_CLASS}`}
        >
          <option value="">Geen klant gekoppeld</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {client.consent ? '· toestemming' : '· geen toestemming'}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <p
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            selected.consent ? 'bg-accent-soft text-accent-dark' : 'bg-red-50 text-red-800'
          }`}
        >
          {selected.consent
            ? 'Mag gedeeld worden (portfolio en Instagram)'
            : 'Niet delen: geen fototoestemming'}
        </p>
      )}
    </div>
  );
}

export default function PortfolioTab() {
  const [items, setItems] = useState<PortfolioItemRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Upload-formulier
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<PortfolioCategoryId>('nails');
  const [title, setTitle] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [transparent, setTransparent] = useState(false);

  const [frames, setFrames] = useState<PortfolioFrames>({ ...NO_FRAMES });
  const [framesStatus, setFramesStatus] = useState<string | null>(null);

  const [filter, setFilter] = useState<PortfolioCategoryId | 'all'>('all');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError('Portfolio laden mislukt.');
          return;
        }
        setError(null);
        setItems(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', PORTFOLIO_CATEGORIES.map((category) => frameSettingKey(category.id)))
      .then(({ data }) => {
        if (!cancelled) setFrames(parseFrames(data));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('admin_profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setClients(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.full_name,
            consent: row.photo_consent === true,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clientById = (id: string | null) => clients.find((client) => client.id === id) ?? null;
  const selectedClient = clientById(clientId || null);

  async function setFrame(id: PortfolioCategoryId, on: boolean) {
    const previous = frames;
    setFrames({ ...frames, [id]: on });
    setFramesStatus(null);
    const { error: saveError } = await supabase
      .from('site_settings')
      .upsert({ key: frameSettingKey(id), value: String(on) }, { onConflict: 'key' });
    if (saveError) {
      setFrames(previous);
      setFramesStatus('Opslaan mislukt. Probeer opnieuw.');
      return;
    }
    setFramesStatus('Opgeslagen. De website past zich binnen een minuut aan.');
  }

  async function handleFileChange(selected: File | null) {
    setFile(selected);
    setTransparent(selected ? await hasTransparency(selected) : false);
  }

  const allTags = useMemo(
    () => Array.from(new Set((items ?? []).flatMap((item) => item.tags))).sort(),
    [items],
  );

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setUploadStatus('Kies eerst een foto.');
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    try {
      const blob = await compressImage(file, { keepAlpha: transparent });
      const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `${categoryId}/${crypto.randomUUID()}.${extension}`;
      const { error: storageError } = await supabase.storage
        .from(PORTFOLIO_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (storageError) throw new Error('Upload mislukt.');

      const { error: insertError } = await supabase.from('portfolio_items').insert({
        category_id: categoryId,
        image_path: path,
        title: title.trim() || null,
        tags: newTags,
        has_transparency: transparent,
        client_id: clientId || null,
        // Zonder toestemming van de gekoppelde klant blijft de foto verborgen.
        is_published: !selectedClient || selectedClient.consent,
      });
      if (insertError) {
        await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
        throw new Error('Opslaan mislukt.');
      }

      setFile(null);
      setTransparent(false);
      setTitle('');
      setNewTags([]);
      setUploadStatus(
        selectedClient && !selectedClient.consent
          ? 'Foto opgeslagen, maar verborgen: deze klant gaf (nog) geen toestemming om foto\'s te delen.'
          : 'Foto toegevoegd aan het portfolio.',
      );
      setClientId('');
      setReload((value) => value + 1);
      (event.target as HTMLFormElement).reset();
    } catch (uploadError) {
      setUploadStatus(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
    }
  }

  async function update(id: string, patch: Partial<PortfolioItemRow>) {
    setBusyId(id);
    const { error: updateError } = await supabase.from('portfolio_items').update(patch).eq('id', id);
    setBusyId(null);
    if (updateError) {
      setError(
        updateError.message.includes('toestemming')
          ? 'Deze klant gaf geen toestemming om foto\'s te delen. Pas dat eerst aan bij Klanten.'
          : 'Wijziging mislukt.',
      );
      return;
    }
    setError(null);
    setItems((current) =>
      (current ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function remove(item: PortfolioItemRow) {
    setBusyId(item.id);
    const { error: deleteError } = await supabase.from('portfolio_items').delete().eq('id', item.id);
    if (!deleteError) await supabase.storage.from(PORTFOLIO_BUCKET).remove([item.image_path]);
    setBusyId(null);
    setConfirmDelete(null);
    if (deleteError) {
      setError('Verwijderen mislukt.');
      return;
    }
    setItems((current) => (current ?? []).filter((entry) => entry.id !== item.id));
  }

  const shown = (items ?? []).filter((item) => filter === 'all' || item.category_id === filter);

  return (
    <div className="space-y-8">
      <section aria-labelledby="frames-heading" className="space-y-3">
        <h2 id="frames-heading" className={SECTION_LABEL}>
          Weergave op de website
        </h2>
        <div className={`${CARD_CLASS} space-y-1`}>
          <p className="pb-2 text-sm leading-relaxed text-primary/70">
            Kies per categorie of de foto&apos;s in een kader staan. Zonder kader komen uitgeknipte
            PNG&apos;s vrij op de pagina te staan; gewone foto&apos;s krijgen enkel afgeronde hoeken.
          </p>
          {PORTFOLIO_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 border-t border-taupe/30 py-3"
            >
              <span className="font-medium text-primary">{category.title}: kader tonen</span>
              <button
                type="button"
                role="switch"
                aria-checked={frames[category.id]}
                aria-label={`Kader tonen bij ${category.title.toLowerCase()}`}
                onClick={() => void setFrame(category.id, !frames[category.id])}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${FOCUS_RING} ${
                  frames[category.id] ? 'bg-accent' : 'bg-taupe/60'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    frames[category.id] ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          ))}
          {framesStatus && (
            <p role="status" className="pt-2 text-sm text-primary/80">
              {framesStatus}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="upload-heading" className="space-y-3">
        <h2 id="upload-heading" className={SECTION_LABEL}>
          Foto toevoegen
        </h2>
        <form onSubmit={handleUpload} className={`${CARD_CLASS} space-y-4`}>
          <label className="block text-sm text-primary/80">
            Foto (JPG, PNG of WebP)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
              className={`mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent-dark ${FOCUS_RING}`}
            />
          </label>
          {transparent && (
            <div role="status" className="rounded-2xl bg-accent-soft/60 px-4 py-3 text-sm text-primary/85">
              <p className="font-medium text-accent-dark">Uitgeknipte PNG herkend</p>
              <p className="mt-1 text-[13px] leading-relaxed">
                Deze foto heeft een doorzichtige achtergrond en komt het mooist uit zonder kader.
                {frames[categoryId] ? (
                  <>
                    {' '}
                    Bij {PORTFOLIO_CATEGORIES.find((c) => c.id === categoryId)?.title.toLowerCase()} staat
                    het kader nu aan.
                  </>
                ) : (
                  <> Bij deze categorie staat het kader al uit.</>
                )}
              </p>
              {frames[categoryId] && (
                <button
                  type="button"
                  onClick={() => void setFrame(categoryId, false)}
                  className={`${BUTTON_SECONDARY} mt-3`}
                >
                  Kader uitzetten voor deze categorie
                </button>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-primary/80">
              Categorie
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value as PortfolioCategoryId)}
                className={`mt-2 ${INPUT_CLASS}`}
              >
                {PORTFOLIO_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-primary/80">
              Titel (optioneel)
              <input
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="bv. Milky French"
                className={`mt-2 ${INPUT_CLASS}`}
              />
            </label>
          </div>
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />
          <div className="text-sm text-primary/80">
            Tags
            <TagEditor tags={newTags} suggestions={allTags} onChange={setNewTags} disabled={uploading} />
          </div>
          <p className="text-xs leading-relaxed text-primary/55">
            Koppel de foto aan de klant, zodat je altijd ziet of ze gedeeld mag worden. Zonder
            toestemming blijft de foto verborgen. Gezichten liefst niet herkenbaar.
          </p>
          {uploadStatus && (
            <p role="status" className="text-sm text-primary/80">
              {uploadStatus}
            </p>
          )}
          <button type="submit" disabled={uploading} className={`${BUTTON_PRIMARY} gap-2`}>
            <Upload size={16} aria-hidden="true" />
            {uploading ? 'Bezig met uploaden…' : 'Toevoegen'}
          </button>
        </form>
      </section>

      <section aria-labelledby="items-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="items-heading" className={SECTION_LABEL}>
            In het portfolio
          </h2>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as PortfolioCategoryId | 'all')}
            aria-label="Filter op categorie"
            className={`min-h-12 rounded-2xl border border-taupe/50 bg-canvas px-4 text-sm ${FOCUS_RING}`}
          >
            <option value="all">Alle categorieën</option>
            {PORTFOLIO_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {items === null && !error && <p className="text-sm text-primary/70">Laden…</p>}
        {items !== null && shown.length === 0 && (
          <p className="text-sm text-primary/70">Nog geen foto&apos;s in deze categorie.</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id} className={`${CARD_CLASS} space-y-3`}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-canvas">
                <img
                  src={publicUrl(item.image_path)}
                  alt={item.title ?? ''}
                  loading="lazy"
                  className={`h-full w-full ${item.has_transparency ? 'object-contain p-3' : 'object-cover'} ${item.is_published ? '' : 'opacity-50 grayscale'}`}
                />
                {!item.is_published && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary/80 px-2.5 py-1 text-[11px] text-canvas">
                    Verborgen
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={item.category_id}
                  disabled={busyId === item.id}
                  onChange={(event) =>
                    update(item.id, { category_id: event.target.value as PortfolioCategoryId })
                  }
                  aria-label="Categorie"
                  className={`min-h-12 rounded-2xl border border-taupe/50 bg-canvas px-3 text-sm ${FOCUS_RING}`}
                >
                  {PORTFOLIO_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => update(item.id, { is_published: !item.is_published })}
                  className={BUTTON_SECONDARY}
                >
                  {item.is_published ? 'Verbergen' : 'Tonen'}
                </button>
              </div>
              <input
                defaultValue={item.title ?? ''}
                maxLength={80}
                placeholder="Titel"
                aria-label="Titel"
                onBlur={(event) => {
                  const value = event.target.value.trim() || null;
                  if (value !== item.title) update(item.id, { title: value });
                }}
                className={INPUT_CLASS}
              />
              <TagEditor
                tags={item.tags}
                suggestions={allTags}
                disabled={busyId === item.id}
                onChange={(tags) => update(item.id, { tags })}
              />
              <ClientPicker
                clients={clients}
                value={item.client_id ?? ''}
                disabled={busyId === item.id}
                onChange={(value) => {
                  const next = clientById(value || null);
                  update(item.id, {
                    client_id: value || null,
                    ...(next && !next.consent ? { is_published: false } : {}),
                  });
                }}
              />
              {confirmDelete === item.id ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={busyId === item.id}
                    className={`${BUTTON_PRIMARY} flex-1 bg-red-800 hover:bg-red-900`}
                  >
                    Definitief verwijderen
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className={BUTTON_SECONDARY}>
                    Annuleren
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(item.id)}
                  className={`${BUTTON_SECONDARY} w-full gap-2 text-primary/70`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Verwijderen
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
