import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';
import type { ReactNode } from 'react';
import { Mail, MessageCircle, MessageSquareText, Phone } from 'lucide-react';
import MapEmbed from '@/components/MapEmbed';
import ContactMessageForm from '@/components/ContactMessageForm';
import Ornament from '@/components/Ornament';
import PageHeader from '@/components/PageHeader';
import { CONTACT, SALON, isFilledIn } from '@/lib/salon';

const TITLE = 'Contact & route | Belise Beauty Opwijk';
const DESCRIPTION =
  'Belise, Nanovestraat 71, 1745 Opwijk. Bel, stuur een sms, WhatsApp of mail, bekijk de route of stuur een bericht via je account.';

const PATH = '/contact';
const TYPE = 'ContactPage';

export const metadata: Metadata = pageMetadata(PATH, TITLE, DESCRIPTION);

const WHATSAPP_TEXT = 'Hallo Belise, ik heb een vraag:';

function ContactTile({
  href,
  icon,
  title,
  detail,
  external = false,
}: {
  href: string | null;
  icon: ReactNode;
  title: string;
  detail: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark ring-1 ring-accent/15 transition-transform duration-500 group-hover:scale-105">
        {icon}
      </span>
      <span className="mt-5 block font-serif text-2xl text-stone-900">{title}</span>
      <span className="mt-1 block text-[13px] text-primary/60">{detail}</span>
    </>
  );

  const base =
    'reveal shadow-luxe ease-luxe group flex flex-col items-start rounded-[1.75rem] bg-card p-6 ring-1 ring-taupe/25 transition-[transform,box-shadow] duration-500';

  if (!href) {
    return (
      <div className={`${base} opacity-70`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${base} hover:-translate-y-0.5 hover:shadow-luxe-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:hover:translate-y-0`}
    >
      {content}
    </a>
  );
}

export default function ContactPage() {
  const hasPhone = isFilledIn(CONTACT.phoneInternational);
  const hasEmail = isFilledIn(CONTACT.email);

  return (
    <main className="flex-1">
      <JsonLd data={pageSchema({ path: PATH, name: TITLE, description: DESCRIPTION, type: TYPE })} />
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-12 lg:px-8 lg:pt-16">
        <PageHeader
          eyebrow="Contact"
          title={
            <>
              Zeg gerust <span className="italic text-accent">hallo</span>
            </>
          }
        >
          <p>Tik op een knop en je toestel opent meteen de juiste app. Of log in en stuur Belise een bericht via de site.</p>
        </PageHeader>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ContactTile
            href={hasPhone ? `tel:+${CONTACT.phoneInternational}` : null}
            icon={<Phone size={18} aria-hidden="true" />}
            title="Bellen"
            detail={isFilledIn(CONTACT.phone) ? CONTACT.phone : 'Nummer volgt binnenkort'}
          />
          <ContactTile
            href={hasPhone ? `sms:+${CONTACT.phoneInternational}` : null}
            icon={<MessageSquareText size={18} aria-hidden="true" />}
            title="Sms"
            detail={hasPhone ? 'Stuur een bericht (Berichten)' : 'Volgt binnenkort'}
          />
          <ContactTile
            href={
              hasPhone
                ? `https://wa.me/${CONTACT.phoneInternational}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
                : null
            }
            icon={<MessageCircle size={18} aria-hidden="true" />}
            title="WhatsApp"
            detail={hasPhone ? 'Open een chat met Belise' : 'Volgt binnenkort'}
            external
          />
          <ContactTile
            href={hasEmail ? `mailto:${CONTACT.email}` : null}
            icon={<Mail size={18} aria-hidden="true" />}
            title="Mail"
            detail={hasEmail ? CONTACT.email : 'E-mailadres volgt binnenkort'}
          />
        </div>
      </section>

      <Ornament className="px-6" />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.25fr] lg:px-8 lg:py-16">
        <div className="reveal">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
            De salon
          </p>
          <address className="mt-4 not-italic">
            <span className="block font-serif text-3xl leading-tight text-stone-900">
              {SALON.address.street}
            </span>
            <span className="mt-1 block text-[15px] text-primary/70">{SALON.address.postalCity}</span>
          </address>
          <div aria-hidden="true" className="hairline my-8 h-px" />
          <p className="font-serif text-xl italic text-primary">Enkel op afspraak</p>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-primary/65">
            Belise werkt op vrijgegeven momenten. Kijk in de online agenda wanneer er plaats is.
          </p>
          <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-primary/55">
            {SALON.parking}
          </p>
          <div className="mt-8">
            <MapEmbed street={SALON.address.street} postalCity={SALON.address.postalCity} />
          </div>
        </div>

        <div
          id="bericht"
          className="reveal shadow-luxe rounded-[1.75rem] bg-card p-6 ring-1 ring-taupe/25 sm:p-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
            Bericht via je account
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900">Stuur Belise een bericht</h2>
          <div aria-hidden="true" className="hairline my-6 h-px" />
          <ContactMessageForm />
        </div>
      </section>
    </main>
  );
}
