'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FOCUS_RING } from '@/lib/admin/ui';

const PHOTO_BUCKET = 'booking-references';
const SIGNED_URL_SECONDS = 3600;

type PhotoThumbsProps = {
  paths: (string | null)[];
};

/** Toont referentiefoto's via tijdelijke signed URLs. Klikken opent de foto schermvullend. */
export default function PhotoThumbs({ paths }: PhotoThumbsProps) {
  const pathList = paths.filter((path): path is string => Boolean(path));
  const pathKey = pathList.join('|');
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const list = pathKey ? pathKey.split('|') : [];
    if (list.length === 0) return;

    let cancelled = false;

    Promise.all(
      list.map(async (path) => {
        const { data, error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(path, SIGNED_URL_SECONDS);
        return { path, url: error || !data ? null : data.signedUrl };
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const { path, url } of results) {
        if (url) next[path] = url;
      }
      setUrls(next);
    });

    return () => {
      cancelled = true;
    };
  }, [pathKey]);

  if (pathList.length === 0) return null;

  const visible = pathList.filter((path) => urls[path]);

  return (
    <>
      {visible.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {visible.map((path) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => setPreview(urls[path])}
                aria-label="Referentiefoto schermvullend bekijken"
                className={`block h-24 w-24 overflow-hidden rounded-2xl border border-taupe/50 ${FOCUS_RING}`}
              >
                <img src={urls[path]} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Referentiefoto"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <img
            src={preview}
            alt="Referentiefoto van de klant"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className={`absolute right-4 top-4 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-medium text-primary ${FOCUS_RING}`}
          >
            Sluiten
          </button>
        </div>
      )}
    </>
  );
}