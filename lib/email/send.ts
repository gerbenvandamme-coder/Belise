import { Resend } from 'resend';
import { requireEnv } from '@/lib/config';

export type EmailAttachment = { filename: string; content: Buffer };

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

let client: Resend | null = null;

function getClient(): Resend {
  client ??= new Resend(requireEnv('RESEND_API_KEY'));
  return client;
}

/** Verstuurt een e-mail via Resend en gooit een fout als Resend de mail weigert. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { error } = await getClient().emails.send({
    from: requireEnv('EMAIL_FROM'),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });

  if (error) throw new Error(`Resend weigerde de e-mail: ${error.message}`);
}