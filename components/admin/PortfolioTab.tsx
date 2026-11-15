'use client';

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/supabaseStorage';
import { PORTFOLIO_BUCKET, PORTFOLIO_CATEGORIES, normalizeTag } from '@/lib/portfolio';
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

  const [filter, setFilter] = useState<PortfolioCategoryId | 'all'>('all');
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
      const blob = await compressImage(file);
      const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
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
      });
      if (insertError) {
        await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
        throw new Error('Opslaan mislukt.');
      }

      setFile(null);
      setTitle('');
      setNewTags([]);
      setUploadStatus('Foto toegevoegd aan het portfolio.');
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
      setError('Wijziging mislukt.');
      return;
    }
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
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className={`mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent-dark ${FOCUS_RING}`}
            />
          </label>
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
          <div className="text-sm text-primary/80">
            Tags
            <TagEditor tags={newTags} suggestions={allTags} onChange={setNewTags} disabled={uploading} />
          </div>
          <p className="text-xs leading-relaxed text-primary/55">
            Plaats enkel foto&apos;s waarvoor de klant toestemming gaf. Gezichten liefst niet herkenbaar.
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
                  className={`h-full w-full object-cover ${item.is_published ? '' : 'opacity-50 grayscale'}`}
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
