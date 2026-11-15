'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

const ACCEPTED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 15 * 1024 * 1024;

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type PhotoDropzoneProps = {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function PhotoDropzone({
  label,
  hint,
  file,
  onChange,
  disabled = false,
}: PhotoDropzoneProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError('Kies een JPEG-, PNG- of WebP-afbeelding.');
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError('Deze foto is te groot (max. 15 MB).');
      return;
    }
    setError(null);
    onChange(candidate);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    accept(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    accept(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setDragging(true);
  };

  const buttonClass = `inline-flex items-center gap-2 rounded-full border border-taupe/50 bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS_RING}`;

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : hintId}>
      <p id={labelId} className="text-sm font-medium text-primary">
        {label}
      </p>
      <p id={hintId} className="mt-1 text-xs text-primary/60">
        {hint}
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-3 flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-4 text-center transition-colors motion-reduce:transition-none ${
          dragging ? 'border-accent bg-accent-soft' : 'border-taupe/60 bg-card'
        }`}
      >
        {file && previewUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob-URL, geen optimalisatie nodig */}
            <img
              src={previewUrl}
              alt={`Voorbeeld van ${label}`}
              className="max-h-48 w-auto rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label={`${label}: foto verwijderen`}
              className={`absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm disabled:opacity-50 ${FOCUS_RING}`}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-primary/70">Sleep een foto hierheen of kies er een.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => galleryRef.current?.click()}
                className={buttonClass}
              >
                <ImagePlus size={16} aria-hidden="true" />
                Kies foto
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => cameraRef.current?.click()}
                className={buttonClass}
              >
                <Camera size={16} aria-hidden="true" />
                Maak foto
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInput}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInput}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}