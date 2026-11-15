'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { safeNextPath } from '@/lib/authRedirect';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const FAILURE_MESSAGE =
  'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan om in te loggen.';

/** Supabase meldt fouten in de query (PKCE) of in de hash (impliciete flow). */
function readUrlError(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('error_description') ?? searchParams.get('error');
  if (fromQuery) return fromQuery;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return hash.get('error_description') ?? hash.get('error');
}

function CallbackFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // React Strict Mode start effecten dubbel; een code mag maar één keer worden ingewisseld.
    if (started.current) return;
    started.current = true;

    async function finishLogin() {
      const next = safeNextPath(searchParams.get('next'));

      if (readUrlError(searchParams)) {
        setFailed(true);
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // De client kan de code al zelf hebben ingewisseld. Dan bestaat de sessie al.
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setFailed(true);
            return;
          }
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setFailed(true);
          return;
        }
      }

      router.replace(next);
    }

    finishLogin().catch(() => setFailed(true));
  }, [router, searchParams]);

  if (failed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
        <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-[-0.015em] text-primary">
          Inloggen mislukt
        </h1>
        <p role="alert" className="mt-6 text-base leading-relaxed text-primary/70">
          {FAILURE_MESSAGE}
        </p>
        <Link
          href="/account"
          className={`mt-10 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark motion-reduce:transition-none ${FOCUS_RING}`}
        >
          Nieuwe link aanvragen
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-20 text-center lg:py-28">
      <p role="status" className="text-base text-primary/70">
        Je wordt ingelogd...
      </p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackFlow />
    </Suspense>
  );
}