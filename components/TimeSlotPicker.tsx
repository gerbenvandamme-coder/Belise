'use client';

import { useEffect, useState } from 'react';
import { toDateKey } from '@/lib/schedule';
import { fetchAvailableSlots } from '@/lib/whitelist';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type SlotResult = {
  key: string;
  slots: string[];
  error: string | null;
};

type TimeSlotPickerProps = {
  date: Date | null;
  durationMinutes: number;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
};

/** Toont de vrije starturen die de database (get_available_slots) teruggeeft voor de gekozen dag. */
export default function TimeSlotPicker({
  date,
  durationMinutes,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  const requestKey = date ? `${toDateKey(date)}|${durationMinutes}` : null;
  const [result, setResult] = useState<SlotResult | null>(null);

  useEffect(() => {
    if (!date || requestKey === null) return;

    let cancelled = false;
    fetchAvailableSlots(date, durationMinutes)
      .then((slots) => {
        if (!cancelled) setResult({ key: requestKey, slots, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : 'De beschikbare uren konden niet worden geladen.';
        setResult({ key: requestKey, slots: [], error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [date, durationMinutes, requestKey]);

  if (!date) {
    return <p className="text-sm text-primary/60">Kies eerst een dag.</p>;
  }

  if (result?.key !== requestKey) {
    return (
      <p role="status" className="text-sm text-primary/60">
        Beschikbare uren laden...
      </p>
    );
  }

  if (result.error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {result.error}
      </p>
    );
  }

  if (result.slots.length === 0) {
    return (
      <p className="text-sm text-primary/60">
        Geen vrije uren op deze dag voor deze behandeling. Kies een andere dag.
      </p>
    );
  }

  return (
    <div role="group" aria-label="Beschikbare starturen" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {result.slots.map((slot) => {
        const selected = slot === selectedTime;
        return (
          <button
            key={slot}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectTime(slot)}
            className={`rounded-full px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none ${FOCUS_RING} ${
              selected
                ? 'bg-accent font-medium text-white shadow-sm'
                : 'bg-card text-primary ring-1 ring-taupe/40 hover:bg-accent-soft hover:text-accent-dark'
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}