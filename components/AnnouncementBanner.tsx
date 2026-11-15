'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** Mededelingsbanner bovenaan de site. Aan/uit en tekst komen uit public.site_settings (beheer in /admin). */
export default function AnnouncementBanner() {
  const pathname = usePathname();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['announcement_enabled', 'announcement_text'])
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const enabled = data.find((row) => row.key === 'announcement_enabled')?.value === 'true';
        const value = data.find((row) => row.key === 'announcement_text')?.value.trim() ?? '';
        setText(enabled && value ? value : null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!text || pathname?.startsWith('/admin')) return null;

  return (
    <div
      role="status"
      className="bg-primary px-4 py-2.5 text-center text-sm font-medium tracking-wide text-canvas"
    >
      {text}
    </div>
  );
}
