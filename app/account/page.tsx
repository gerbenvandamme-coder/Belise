'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { safeNextPath } from '@/lib/authRedirect';

type Mode = 'login' | 'register';

type SessionState =
  | { status: 'loading' }
  | { status: 'out' }
  | { status: 'in'; email: string };

const SECTION_HEADING = 'font-serif text-4xl font-light leading-[1.08] tracking-[-0.015em] text-primary sm:text-5xl';
const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const INPUT_CLASS = `mt-2 w-full rounded-2xl border border-taupe/50 bg-canvas px-4 py-3 text-sm text-primary placeholder:text-primary/40 ${FOCUS_RING}`;
const CHECKBOX_CLASS = `mt-0.5 h-4 w-4 shrink-0 rounded border-taupe/60 accent-accent ${FOCUS_RING}`;
const PRIMARY_BUTTON = `inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-accent/40 motion-reduce:transition-none ${FOCUS_RING}`;
const SECONDARY_LINK = `inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-6 py-3 text-sm font-medium text-primary transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-dark motion-reduce:transition-none ${FOCUS_RING}`;

function describeAuthError(error: { message: string; status?: number; code?: string }): string {
  const message = error.message.toLowerCase();
  if (message.includes('signups not allowed') || error.code === 'otp_disabled') {
    return 'Er is geen account met dit e-mailadres. Kies "Registreren" om een account aan te maken.';
  }
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return 'Je hebt net al een link aangevraagd. Wacht een minuut en probeer het opnieuw.';
  }
  if (message.includes('database error saving new user')) {
    return 'Registreren is niet gelukt. Controleer je gegevens en probeer het opnieuw.';
  }
  return 'De link kon niet worden verstuurd. Probeer het later opnieuw.';
}

function AccountFlow() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const returnsToBooking = next.startsWith('/booking');

  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  // Beide toestemmingen staan standaard uit: de klant moet ze bewust aanvinken.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [allergyConsent, setAllergyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setSession(
        data.user ? { status: 'in', email: data.user.email ?? '' } : { status: 'out' },
      );
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(
        authSession?.user
          ? { status: 'in', email: authSession.user.email ?? '' }
          : { status: 'out' },
      );
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAllergies = allergies.trim();

    if (mode === 'register') {
      if (trimmedName.length < 2) {
        setError('Vul je volledige naam in.');
        return;
      }
      if (!termsAccepted) {
        setError('Ga akkoord met de algemene voorwaarden om een account aan te maken.');
        return;
      }
      if (trimmedAllergies && !allergyConsent) {
        setError(
          'Geef toestemming om je allergieën te bewaren, of maak het veld allergieën leeg.',
        );
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      let options: {
        shouldCreateUser: boolean;
        emailRedirectTo: string;
        data?: Record<string, string>;
      };

      if (mode === 'login') {
        options = { shouldCreateUser: false, emailRedirectTo };
      } else {
        const now = new Date().toISOString();
        // De database-trigger handle_new_user maakt hieruit het profiel aan.
        const data: Record<string, string> = {
          full_name: trimmedName,
          terms_accepted_at: now,
        };
        if (trimmedPhone) data.phone = trimmedPhone;
        if (trimmedAllergies) {
          data.allergies = trimmedAllergies;
          data.allergy_consent_at = now;
        }
        options = { shouldCreateUser: true, emailRedirectTo, data };
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options,
      });

      if (otpError) {
        setError(describeAuthError(otpError));
        return;
      }
      setSentTo(trimmedEmail);
    } catch {
      setError('Geen verbinding met de server. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const backLink = (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary/70 transition-colors hover:text-accent-dark ${FOCUS_RING}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Terug naar home
    </Link>
  );

  if (session.status === 'loading') {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 lg:py-24">
        <p role="status" className="text-sm text-primary/60">
          Even laden...
        </p>
      </main>
    );
  }

  if (session.status === 'in') {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 lg:py-24">
        {backLink}
        <h1 className={`mt-8 ${SECTION_HEADING}`}>Mijn account</h1>
        <p className="mt-6 text-base leading-relaxed text-primary/70">
          Je bent ingelogd als <span className="font-medium text-primary">{session.email}</span>.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/account/mijn-afspraken" className={SECONDARY_LINK}>
            Mijn afspraken
          </Link>
          <Link href={returnsToBooking ? next : '/booking'} className={SECONDARY_LINK}>
            {returnsToBooking ? 'Verder met mijn boeking' : 'Nieuwe afspraak maken'}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-primary/70 transition-colors hover:text-accent-dark ${FOCUS_RING}`}
          >
            Uitloggen
          </button>
        </div>
      </main>
    );
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white">
          <Mail size={28} aria-hidden="true" />
        </span>
        <h1 className={`mt-8 ${SECTION_HEADING}`}>Check je mail</h1>
        <p role="status" className="mt-6 max-w-md text-base leading-relaxed text-primary/70">
          We stuurden een inloglink naar {sentTo}. Klik op de link om verder te gaan. Je vindt de
          mail eventueel in je spam.
          {returnsToBooking ? ' Daarna ga je terug naar je boeking.' : ''}
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className={`mt-10 ${SECONDARY_LINK}`}
        >
          Ander e-mailadres gebruiken
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 lg:py-24">
      {backLink}

      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          Account
        </p>
        <h1 className={`mt-4 ${SECTION_HEADING}`}>
          {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-primary/70">
          Je hebt geen wachtwoord nodig. We mailen je een link waarmee je direct inlogt.
          {returnsToBooking ? ' Je gekozen behandeling, dag en tijd blijven bewaard.' : ''}
        </p>
      </header>

      <div role="group" aria-label="Inloggen of registreren" className="mt-8 flex gap-2">
        {(['login', 'register'] as const).map((value) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                active
                  ? 'border-accent bg-accent text-white'
                  : 'border-taupe/50 bg-card text-primary hover:border-accent hover:text-accent-dark'
              }`}
            >
              {value === 'login' ? 'Inloggen' : 'Registreren'}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {mode === 'register' && (
          <>
            <label className="block text-sm font-medium text-primary">
              Volledige naam
              <input
                name="fullName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={INPUT_CLASS}
              />
            </label>

            <label className="block text-sm font-medium text-primary">
              Telefoonnummer (optioneel)
              <input
                name="phone"
                type="tel"
                minLength={6}
                maxLength={20}
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          </>
        )}

        <label className="block text-sm font-medium text-primary">
          E-mailadres
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        {mode === 'register' && (
          <>
            <label className="block text-sm font-medium text-primary">
              Allergieën (optioneel)
              <textarea
                name="allergies"
                rows={3}
                maxLength={500}
                value={allergies}
                onChange={(event) => setAllergies(event.target.value)}
                placeholder="Bijvoorbeeld: latex, acrylaat, hennakleurstof"
                className={INPUT_CLASS}
              />
            </label>

            <div className="space-y-4">
              <label className="flex items-start gap-3 text-sm leading-relaxed text-primary/80">
                <input
                  name="termsAccepted"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className={CHECKBOX_CLASS}
                />
                <span>Ik ga akkoord met de algemene voorwaarden van Belise. (verplicht)</span>
              </label>

              <label className="flex items-start gap-3 text-sm leading-relaxed text-primary/80">
                <input
                  name="allergyConsent"
                  type="checkbox"
                  checked={allergyConsent}
                  onChange={(event) => setAllergyConsent(event.target.checked)}
                  className={CHECKBOX_CLASS}
                />
                <span>
                  Ik geef uitdrukkelijk toestemming om de allergieën die ik hierboven invul te
                  bewaren, zodat Belise mijn behandeling hierop kan afstemmen. Allergieën zijn
                  gezondheidsgegevens (art. 9 AVG). Ik kan deze toestemming op elk moment
                  intrekken. (alleen nodig als je allergieën invult)
                </span>
              </label>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting
            ? 'Bezig met versturen...'
            : mode === 'login'
              ? 'Stuur me een inloglink'
              : 'Account aanmaken en link sturen'}
        </button>
      </form>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountFlow />
    </Suspense>
  );
}