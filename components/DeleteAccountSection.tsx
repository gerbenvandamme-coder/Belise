'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BOOKING_BUCKET } from '@/lib/supabaseStorage';
import type { BookingRow } from '@/lib/database.types';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Recht op wissing (art. 17 AVG). Verwijdert eerst de eigen foto's uit de opslag,
 * daarna het account. Het profiel (met allergieën en salonnotities) verdwijnt mee;
 * afspraken blijven zonder koppeling aan de klant bestaan voor de agenda van de salon.
 */
export default function DeleteAccountSection({ bookings }: { bookings: readonly BookingRow[] }) {
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setStep('busy');
    setError(null);

    const paths = bookings
      .flatMap((booking) => [booking.reference_now_path, booking.inspiration_path])
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(BOOKING_BUCKET).remove(paths);
      if (storageError) {
        setError("Je foto's konden niet worden verwijderd. Probeer later opnieuw of mail de salon.");
        setStep('confirm');
        return;
      }
    }

    const { error: rpcError } = await supabase.rpc('delete_own_account');
    if (rpcError) {
      setError('Je account kon niet worden verwijderd. Probeer later opnieuw of mail de salon.');
      setStep('confirm');
      return;
    }

    await supabase.auth.signOut();
    router.replace('/?account=verwijderd');
  }

  return (
    <section aria-labelledby="delete-account-heading" className="mt-16 border-t border-taupe/40 pt-8">
      <h2 id="delete-account-heading" className="text-sm font-semibold text-primary">
        Account verwijderen
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-primary/65">
        Je account, je allergieën, je salonnotities en je geüploade foto&apos;s worden definitief
        gewist. Dit kan niet ongedaan worden gemaakt.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {step === 'idle' ? (
        <button
          type="button"
          onClick={() => setStep('confirm')}
          className={`mt-4 inline-flex min-h-11 items-center rounded-full border border-taupe/60 px-5 text-sm font-medium text-primary/80 transition-colors hover:border-red-700/50 hover:text-red-800 ${FOCUS_RING}`}
        >
          Account verwijderen
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={step === 'busy'}
            className={`inline-flex min-h-11 items-center rounded-full bg-red-800 px-5 text-sm font-medium text-white transition-colors hover:bg-red-900 disabled:opacity-60 ${FOCUS_RING}`}
          >
            {step === 'busy' ? 'Bezig met verwijderen…' : 'Ja, verwijder alles definitief'}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            disabled={step === 'busy'}
            className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium text-primary/70 hover:text-primary ${FOCUS_RING}`}
          >
            Annuleren
          </button>
        </div>
      )}
    </section>
  );
}
