import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { pageSchema } from '@/lib/structuredData';
import Link from 'next/link';
import LegalPage, { Fill, LegalSection } from '@/components/LegalPage';
import { SALON } from '@/lib/salon';

const TITLE = 'Privacyverklaring | Belise';
const DESCRIPTION =
  'Hoe Belise omgaat met je persoonsgegevens.';

const PATH = '/privacy';
const TYPE = 'WebPage';

export const metadata: Metadata = pageMetadata(PATH, TITLE, DESCRIPTION);

const legal = SALON.legal;
const isDraft = Object.values(legal).some((value) => value.startsWith('['));

export default function PrivacyPage() {
  return (
    <>
    <JsonLd data={pageSchema({ path: PATH, name: TITLE, description: DESCRIPTION, type: TYPE })} />
    <LegalPage
      eyebrow="Privacy"
      title="Privacyverklaring"
      lastUpdated={legal.lastUpdated}
      draft={isDraft}
    >
      <p className="mt-8 text-[15px] leading-relaxed text-primary/80">
        Belise gaat zorgvuldig om met je gegevens. Hieronder lees je welke gegevens we bewaren,
        waarom, hoe lang, en welke rechten je hebt. Deze verklaring volgt de Algemene Verordening
        Gegevensbescherming (AVG / GDPR).
      </p>

      <LegalSection title="1. Wie is verantwoordelijk?">
        <p>
          <Fill>{legal.ownerName}</Fill>, handelend onder de naam Belise (<Fill>{legal.legalForm}</Fill>
          ), {SALON.address.street}, {SALON.address.postalCity}, ondernemingsnummer{' '}
          <Fill>{legal.enterpriseNumber}</Fill>.
        </p>
        <p>
          Vragen over je gegevens? Mail naar <Fill>{legal.email}</Fill>.
        </p>
      </LegalSection>

      <LegalSection title="2. Welke gegevens en waarom?">
        <ul>
          <li>
            <strong className="font-medium text-primary">Account</strong>: naam, e-mailadres en
            telefoonnummer. Nodig om je afspraken te beheren en je te contacteren over je afspraak
            (uitvoering van de overeenkomst, art. 6.1.b AVG).
          </li>
          <li>
            <strong className="font-medium text-primary">Afspraken</strong>: gekozen
            behandelingen, datum en uur, prijs, je opmerkingen en eventueel je nagelontwerp uit de
            designer (art. 6.1.b AVG).
          </li>
          <li>
            <strong className="font-medium text-primary">Allergieën</strong>: enkel als je ze zelf
            invult. Dit zijn gezondheidsgegevens. We bewaren ze alleen met je uitdrukkelijke
            toestemming (art. 9.2.a AVG), om je behandeling veilig te laten verlopen. Je kunt die
            toestemming altijd intrekken via je account of per e-mail.
          </li>
          <li>
            <strong className="font-medium text-primary">Foto&apos;s</strong> die je bij een boeking
            uploadt (huidige situatie en inspiratie): om je behandeling voor te bereiden (art. 6.1.b
            AVG). Ze staan in een afgeschermde opslag en zijn enkel zichtbaar voor jou en Belise.
          </li>
          <li>
            <strong className="font-medium text-primary">Foto&apos;s van het resultaat op Instagram</strong>
            : enkel als je dat bij je boeking aanvinkt (toestemming, art. 6.1.a AVG). Je kunt dit
            altijd intrekken.
          </li>
          <li>
            <strong className="font-medium text-primary">Salonnotities</strong>: bijvoorbeeld je
            kleurformule of favoriete nageltint, zodat je volgende behandeling vlot verloopt
            (gerechtvaardigd belang, art. 6.1.f AVG). Je kunt deze notities opvragen.
          </li>
          <li>
            <strong className="font-medium text-primary">Technische gegevens</strong>: je IP-adres
            wordt kort verwerkt door onze hosting en beveiliging, om de site veilig en bereikbaar te
            houden (gerechtvaardigd belang, art. 6.1.f AVG).
          </li>
        </ul>
        <p>We verkopen je gegevens nooit en gebruiken ze niet voor reclame van derden.</p>
      </LegalSection>

      <LegalSection title="3. Wie verwerkt je gegevens voor ons?">
        <ul>
          <li>
            <strong className="font-medium text-primary">Supabase</strong>: database, login en
            beveiligde foto-opslag. De gegevens staan op servers in de Europese Unie (Frankfurt).
            Supabase verstuurt ook de e-mails met je inloglink.
          </li>
          <li>
            <strong className="font-medium text-primary">Cloudflare</strong>: hosting en
            beveiliging van de website. Cloudflare ziet je IP-adres en de pagina&apos;s die je
            opvraagt, maar niet je account-, afspraak- of gezondheidsgegevens: die gaan rechtstreeks
            van je browser naar Supabase.
          </li>
          <li>
            <strong className="font-medium text-primary">Google Maps</strong>: de kaart op de
            contactpagina laadt pas nadat je op &quot;Kaart tonen&quot; klikt. Vanaf dan maakt je
            browser verbinding met Google, dat je IP-adres en toestelgegevens kan verwerken volgens
            het eigen privacybeleid. Klik je niet, dan gaat er niets naar Google.
          </li>
        </ul>
        <p>
          Met Supabase en de hostingpartij geldt een verwerkersovereenkomst (art. 28 AVG). Als gegevens buiten de
          Europese Economische Ruimte kunnen worden geraadpleegd, bijvoorbeeld voor technische
          ondersteuning door een Amerikaans moederbedrijf, gebeurt dat op basis van het EU-VS Data
          Privacy Framework of de standaardcontractbepalingen van de Europese Commissie (art. 45-46
          AVG).
        </p>
      </LegalSection>

      <LegalSection title="4. Hoe lang bewaren we je gegevens?">
        <ul>
          <li>Account en allergieën: tot je je account verwijdert of je toestemming intrekt.</li>
          <li>
            Afspraken en salonnotities:{' '}
            <Fill>[IN TE VULLEN: bv. tot 3 jaar na je laatste afspraak]</Fill>.
          </li>
          <li>
            Foto&apos;s bij een boeking: <Fill>[IN TE VULLEN: bv. 12 maanden na de afspraak]</Fill>.
          </li>
          <li>Gegevens die we wettelijk moeten bewaren (bv. facturen): zolang de wet dat vraagt.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Je rechten">
        <p>
          Je hebt recht op inzage, verbetering, verwijdering, beperking en overdraagbaarheid van je
          gegevens, en je kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.
          Gegeven toestemming kun je altijd intrekken, zonder dat dit de eerdere verwerking
          onrechtmatig maakt.
        </p>
        <p>
          Je kunt je account zelf verwijderen via{' '}
          <Link href="/account/mijn-afspraken" className="text-accent-dark underline underline-offset-4">
            Mijn afspraken
          </Link>
          . Voor de andere rechten mail je naar <Fill>{legal.email}</Fill>. We antwoorden binnen
          een maand.
        </p>
        <p>
          Ben je niet tevreden? Je kunt een klacht indienen bij de Gegevensbeschermingsautoriteit,
          Drukpersstraat 35, 1000 Brussel (www.gegevensbeschermingsautoriteit.be).
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies en lokale opslag">
        <p>
          We gebruiken geen advertentie- of analysecookies. Je browser bewaart enkel wat nodig is om
          de site te laten werken: je login-sessie en, tijdelijk, je gekozen afspraak of
          nagelontwerp terwijl je inlogt. Daarvoor is geen toestemming nodig.
        </p>
      </LegalSection>

      <LegalSection title="7. Wijzigingen">
        <p>
          Als we deze verklaring aanpassen, zie je dat aan de datum bovenaan. Bij belangrijke
          wijzigingen laten we het je weten.
        </p>
      </LegalSection>
    </LegalPage>
    </>
  );
}
