'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_MODE, supabase } from '@/lib/supabase';
import { BUTTON_PRIMARY, CARD_CLASS, INPUT_CLASS } from '@/lib/admin/ui';

type GuardState = 'checking' | 'signed-out' | 'allowed';

type AdminGuardProps = {
  children: ReactNode;
};

/**
 * Toont admin-inhoud pas na een controle in de browser: ingelogd én profiles.role = 'admin'.
 * Niet-admins zien nooit admin-data. De echte grens ligt in de RLS-policies van de database.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (cancelled) return;

      if (!user) {
        setState('signed-out');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;

      if (error || data?.role !== 'admin') {
        router.replace('/account');
        return;
      }
      setState('allowed');
    }

    verify();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      verify();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setLoginError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);
    if (error) {
      setLoginError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
    }
  }

  if (state === 'allowed') {
    return (
      <>
        {DEMO_MODE && (
          <p className="sticky top-0 z-50 bg-accent-dark px-4 py-1.5 text-center text-xs font-medium text-white">
            Demo-omgeving · voorbeeldgegevens · niets wordt opgeslagen
          </p>
        )}
        {children}
      </>
    );
  }

  if (state === 'checking') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6">
        <p role="status" className="text-sm text-primary/70">
          Even controleren…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-16">
      <form onSubmit={handleSignIn} className={`${CARD_CLASS} space-y-4`}>
        <h1 className="font-serif text-3xl font-normal text-primary">Belise Admin</h1>

        <label className="block text-sm text-primary/80">
          E-mailadres
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        <label className="block text-sm text-primary/80">
          Wachtwoord
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </label>

        {loginError && (
          <p role="alert" className="text-sm text-red-700">
            {loginError}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} w-full`}>
          {submitting ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
    </main>
  );
}