'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminProfileRow, MessageRow, MessageStatus } from '@/lib/database.types';
import { BUTTON_SECONDARY, CARD_CLASS, FOCUS_RING } from '@/lib/admin/ui';

const STATUS: Record<MessageStatus, { label: string; className: string }> = {
  new: { label: 'Nieuw', className: 'bg-accent text-white' },
  read: { label: 'Gelezen', className: 'bg-taupe/30 text-primary' },
  answered: { label: 'Beantwoord', className: 'bg-accent-soft text-accent-dark' },
};

/** Belgisch nummer naar internationaal formaat voor WhatsApp (04.. -> 324..). */
function toWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `32${digits.slice(1)}`;
  return digits;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function MessagesTab() {
  const [messages, setMessages] = useState<MessageRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, AdminProfileRow>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (loadError) {
        setError('Berichten laden mislukt.');
        return;
      }
      const rows = data ?? [];
      const ids = Array.from(new Set(rows.map((row) => row.client_id)));
      const { data: people } = ids.length
        ? await supabase.from('admin_profiles').select('*').in('id', ids)
        : { data: [] as AdminProfileRow[] };
      if (cancelled) return;
      setProfiles(Object.fromEntries((people ?? []).map((person) => [person.id, person])));
      setMessages(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setStatus(id: string, status: MessageStatus) {
    setBusyId(id);
    const { error: updateError } = await supabase.from('messages').update({ status }).eq('id', id);
    setBusyId(null);
    if (updateError) {
      setError('Status wijzigen mislukt.');
      return;
    }
    setMessages((current) =>
      (current ?? []).map((message) => (message.id === id ? { ...message, status } : message)),
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!messages) return <p className="text-sm text-primary/70">Berichten laden…</p>;
  if (messages.length === 0) return <p className="text-sm text-primary/70">Nog geen berichten.</p>;

  return (
    <ul className="space-y-4">
      {messages.map((message) => {
        const person = profiles[message.client_id];
        const whatsapp = person?.phone ? toWhatsApp(person.phone) : null;
        const status = STATUS[message.status];
        return (
          <li key={message.id} className={`${CARD_CLASS} space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-primary">{person?.full_name ?? 'Klant'}</p>
                <p className="text-xs text-primary/55">{formatDateTime(message.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm font-medium text-primary">{message.subject}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-primary/80">{message.body}</p>

            <div className="flex flex-wrap gap-2">
              {person?.email && (
                <a
                  href={`mailto:${person.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                  onClick={() => message.status !== 'answered' && setStatus(message.id, 'answered')}
                  className={`${BUTTON_SECONDARY} gap-2`}
                >
                  <Mail size={15} aria-hidden="true" /> Mail
                </a>
              )}
              {person?.phone && (
                <a href={`tel:${person.phone}`} className={`${BUTTON_SECONDARY} gap-2`}>
                  <Phone size={15} aria-hidden="true" /> Bel
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BUTTON_SECONDARY} gap-2`}
                >
                  <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                </a>
              )}
            </div>

            <div role="group" aria-label="Status" className="flex gap-2">
              {(['read', 'answered'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={busyId === message.id || message.status === value}
                  onClick={() => setStatus(message.id, value)}
                  className={`min-h-12 flex-1 rounded-full border text-sm font-medium transition-colors ${FOCUS_RING} ${
                    message.status === value
                      ? 'border-accent bg-accent-soft text-accent-dark'
                      : 'border-taupe/50 text-primary/80 hover:bg-canvas'
                  }`}
                >
                  {value === 'read' ? 'Markeer gelezen' : 'Markeer beantwoord'}
                </button>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
