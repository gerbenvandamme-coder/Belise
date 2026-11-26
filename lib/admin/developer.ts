'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Accounts van de ontwikkelaar. Enkel zij zien de To-do-tab in /admin; de eigenares niet.
 * Aan te passen via NEXT_PUBLIC_DEVELOPER_EMAILS (komma-gescheiden).
 * Dit is enkel een weergavekeuze, geen beveiliging: de to-dolijst bevat geen klantgegevens.
 */
const DEVELOPER_EMAILS = (process.env.NEXT_PUBLIC_DEVELOPER_EMAILS ?? 'gerben.van.damme@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function useIsDeveloper(): boolean {
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const email = data.user?.email?.toLowerCase() ?? '';
      setIsDeveloper(DEVELOPER_EMAILS.includes(email));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isDeveloper;
}
