'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Check, LogIn, Send } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MessageRow, MessageStatus } from '@/lib/database.types';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const INPUT =
  'mt-2 w-full rounded-2xl border border-taupe/50 bg-canvas px-4 py-3 text-[15px] text-primary placeholder:text-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const SUBJECTS = ['Vraag over een behandeling', 'Over mijn afspraak', 'Iets anders'] as const;

const STATUS_LABEL: Record<MessageStatus, string> = {
  new: 'Verzonden',
  read: 'Gelezen',
  answered: 'Beantwoord',
};

type State =
  | { status: 'loading' }
  | { status: 'out' }
  | { status: 'in'; email: string; messages: MessageRow[] };

export default function ContactMessageForm() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function load() {
    if (!isSupabaseConfigured) {
      setState({ status: 'out' });
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setState({ status: 'out' });
      return;
    }
    // RLS beperkt dit tot de eigen berichten.
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setState({ status: 'in', email: data.user.email ?? '', messages: messages ?? [] });
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) {
      setError('Schrijf eerst je bericht.');
      return;
    }
    setSending(true);
    setError(null);
    const { error: insertError } = await supabase
      .from('messages')
      .insert({ subject, body: text.slice(0, 2000) });
    setSending(false);
    if (insertError) {
      setError(
        insertError.code === 'P0001' && insertError.message
          ? insertError.message
          : 'Verzenden mislukt. Probeer het later opnieuw.',
      );
      return;
    }
    setBody('');
    setSent(true);
    void load();
  }

  if (state.status === 'loading') {
    return <p className="text-sm text-primary/60">Even laden…</p>;
  }

  if (state.status === 'out') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[15px] leading-relaxed text-primary/70">
          Met een account stuur je Belise rechtstreeks een bericht, en zie je hier wanneer het
          gelezen of beantwoord is.
        </p>
        <Link
          href={`/account?next=${encodeURIComponent('/contact')}`}
          className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent ${FOCUS_RING}`}
        >
          <LogIn size={15} aria-hidden="true" />
          Inloggen of registreren
        </Link>
      </div>
    );
  }

  return (
    <div>
      {sent && (
        <p
          role="status"
          className="mb-5 flex items-center gap-2 rounded-2xl bg-accent-soft/70 px-4 py-3 text-sm text-accent-dark"
        >
          <Check size={16} aria-hidden="true" />
          Je bericht is verstuurd. Belise antwoordt via e-mail of telefoon.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[13px] text-primary/60">
          Je schrijft als <span className="font-medium text-primary">{state.email}</span>.
        </p>
        <label className="block text-sm font-medium text-primary">
          Onderwerp
          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={INPUT}
          >
            {SUBJECTS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-primary">
          Bericht
          <textarea
            rows={5}
            maxLength={2000}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
              if (sent) setSent(false);
            }}
            placeholder="Waarmee kan Belise je helpen?"
            className={INPUT}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-canvas transition-colors hover:bg-accent disabled:opacity-60 ${FOCUS_RING}`}
        >
          <Send size={15} aria-hidden="true" />
          {sending ? 'Versturen…' : 'Bericht versturen'}
        </button>
      </form>

      {state.messages.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">
            Je recente berichten
          </p>
          <ul className="mt-3 divide-y divide-taupe/30 rounded-2xl ring-1 ring-taupe/30">
            {state.messages.map((message) => (
              <li key={message.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-primary">{message.subject}</span>
                  <span className="block truncate text-[12px] text-primary/55">{message.body}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${
                    message.status === 'answered'
                      ? 'bg-accent-soft text-accent-dark'
                      : 'bg-taupe/25 text-primary/70'
                  }`}
                >
                  {STATUS_LABEL[message.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
