'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const INPUT = `mt-2 w-full rounded-2xl border border-taupe/50 bg-canvas px-4 py-3 text-sm text-primary placeholder:text-primary/40 ${FOCUS_RING}`;

/** Klant past naam, telefoon en (met toestemming) allergieën aan. Interne salonvelden zijn niet zichtbaar. */
export default function ProfileEditor() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [hadConsent, setHadConsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user || cancelled) return;
      const { data: profile } = await supabase
        .from('client_own_profile')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      if (cancelled) return;
      setUserId(data.user.id);
      if (profile) {
        setFullName(profile.full_name ?? '');
        setPhone(profile.phone ?? '');
        setAllergies(profile.allergies ?? '');
        setHadConsent(Boolean(profile.allergy_consent_at));
        setConsent(Boolean(profile.allergy_consent_at));
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    const cleanName = fullName.trim();
    const cleanAllergies = allergies.trim();
    if (!cleanName) {
      setStatus({ kind: 'error', text: 'Vul je naam in.' });
      return;
    }
    if (cleanAllergies && !consent) {
      setStatus({ kind: 'error', text: 'Geef toestemming om je allergieën te bewaren, of maak het veld leeg.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: cleanName,
        phone: phone.trim() || null,
        allergies: cleanAllergies || null,
        allergy_consent_at: cleanAllergies
          ? hadConsent
            ? undefined
            : new Date().toISOString()
          : null,
      })
      .eq('id', userId);
    setSaving(false);
    if (error) {
      setStatus({ kind: 'error', text: 'Opslaan mislukt. Probeer het later opnieuw.' });
      return;
    }
    setHadConsent(Boolean(cleanAllergies));
    setStatus({ kind: 'ok', text: 'Je gegevens zijn bewaard.' });
  }

  if (!loaded) return <p className="text-sm text-primary/60">Gegevens laden…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <label className="block text-sm font-medium text-primary">
        Naam
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} className={INPUT} autoComplete="name" />
      </label>
      <label className="block text-sm font-medium text-primary">
        Telefoon
        <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={INPUT} autoComplete="tel" inputMode="tel" />
      </label>
      <label className="block text-sm font-medium text-primary">
        Allergieën (optioneel)
        <textarea
          rows={2}
          maxLength={500}
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Bijvoorbeeld: latex, acrylaat"
          className={INPUT}
        />
      </label>
      {allergies.trim() && !hadConsent && (
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-primary/75">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className={`mt-0.5 h-4 w-4 shrink-0 accent-accent ${FOCUS_RING}`}
          />
          Ik geef uitdrukkelijk toestemming om mijn allergieën te bewaren (gezondheidsgegevens, art. 9
          AVG). Ik kan dit altijd intrekken door het veld leeg te maken.
        </label>
      )}
      {status && (
        <p role={status.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${status.kind === 'error' ? 'text-red-700' : 'text-accent-dark'}`}>
          {status.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className={`inline-flex items-center rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent disabled:opacity-60 ${FOCUS_RING}`}
      >
        {saving ? 'Bewaren…' : 'Gegevens bewaren'}
      </button>
    </form>
  );
}
