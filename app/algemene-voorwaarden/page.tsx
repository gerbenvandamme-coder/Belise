import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { Fill, LegalSection } from '@/components/LegalPage';
import { SALON } from '@/lib/salon';

export const metadata: Metadata = {
  title: 'Algemene voorwaarden | Belise',
  description: 'De voorwaarden voor afspraken bij Belise.',
};

const legal = SALON.legal;
// Het annuleringsbeleid is nog niet beslist; daarom blijft de pagina een concept.
const CANCELLATION_POLICY = '[IN TE VULLEN: annuleringstermijn en gevolgen van een no-show]';
const isDraft =
  Object.values(legal).some((value) => value.startsWith('[')) || CANCELLATION_POLICY.startsWith('[');

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Voorwaarden"
      title="Algemene voorwaarden"
      lastUpdated={legal.lastUpdated}
      draft={isDraft}
    >
      <LegalSection title="1. Wie zijn we?">
        <p>
          Belise is een beautysalon van <Fill>{legal.ownerName}</Fill> (<Fill>{legal.legalForm}</Fill>
          ), {SALON.address.street}, {SALON.address.postalCity}. Ondernemingsnummer:{' '}
          <Fill>{legal.enterpriseNumber}</Fill>. Btw: <Fill>{legal.vatStatus}</Fill>.
        </p>
        <p>
          Contact: <Fill>{legal.email}</Fill> · <Fill>{legal.phone}</Fill>.
        </p>
      </LegalSection>

      <LegalSection title="2. Wanneer gelden deze voorwaarden?">
        <p>
          Deze voorwaarden gelden voor elke afspraak die je bij Belise maakt, online of op een
          andere manier. Door een account aan te maken of een afspraak te boeken, aanvaard je ze.
        </p>
      </LegalSection>

      <LegalSection title="3. Account">
        <p>
          Om online te boeken maak je een account aan. Je zorgt ervoor dat je gegevens juist zijn,
          zodat we je kunnen bereiken over je afspraak.{' '}
          <Fill>[IN TE VULLEN: minimumleeftijd, bv. jonger dan 16 boek je via een ouder]</Fill>
        </p>
      </LegalSection>

      <LegalSection title="4. Je afspraak">
        <ul>
          <li>
            Een online boeking is een aanvraag. Je afspraak staat vast zodra Belise ze bevestigt.
          </li>
          <li>
            De prijzen op de site zijn in euro en <Fill>[IN TE VULLEN: inclusief btw / vrijgesteld van btw]</Fill>
            . De prijs die gold op het moment van je boeking blijft gelden.
          </li>
          <li>
            De duur van een behandeling is een richttijd. Een behandeling kan wat korter of langer
            duren, afhankelijk van je haar, nagels of huid.
          </li>
          <li>
            Ben je te laat, dan kan je behandeling ingekort worden, zodat de volgende klant niet
            hoeft te wachten. De volledige prijs blijft verschuldigd.
          </li>
          <li>
            Je betaalt ter plaatse na de behandeling.{' '}
            <Fill>[IN TE VULLEN: aanvaarde betaalmiddelen, bv. Bancontact, Payconiq, cash]</Fill>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Annuleren en no-show">
        <p>
          <Fill>{CANCELLATION_POLICY}</Fill>
        </p>
        <p>
          Kan Belise een afspraak niet laten doorgaan, dan laten we je dat zo snel mogelijk weten en
          zoeken we samen een nieuw moment. Je betaalt dan niets.
        </p>
      </LegalSection>

      <LegalSection title="6. Herroepingsrecht">
        <p>
          <Fill>
            [JURIDISCH NAKIJKEN: online geboekte afspraken zijn overeenkomsten op afstand met in
            principe 14 dagen herroepingsrecht (art. VI.47 WER). Bepaal hoe dit samengaat met het
            annuleringsbeleid, bv. via een uitdrukkelijk verzoek om de dienst binnen de
            herroepingstermijn uit te voeren (art. VI.49 §8 en VI.53, 1° WER).]
          </Fill>
        </p>
      </LegalSection>

      <LegalSection title="7. Je gezondheid en veiligheid">
        <ul>
          <li>
            Meld vóór je behandeling allergieën, overgevoeligheden, zwangerschap, huidproblemen of
            medicatie die een rol kunnen spelen. Je kunt allergieën ook in je account bewaren.
          </li>
          <li>
            Belise mag een behandeling weigeren of aanpassen als die niet veilig is, bijvoorbeeld
            bij een infectie of beschadigde nagels of huid.
          </li>
          <li>Volg de nazorgadviezen die je krijgt; zo blijft het resultaat het mooist.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Klachten en garantie">
        <p>
          Ben je niet tevreden, laat het ons dan zo snel mogelijk weten en uiterlijk binnen{' '}
          <Fill>[IN TE VULLEN: aantal dagen, bv. 7]</Fill> dagen na je behandeling. Belise kijkt
          dan graag hoe het kan worden rechtgezet. Schade door eigen gebruik (bijvoorbeeld werken
          zonder handschoenen, nagels gebruiken als gereedschap) valt niet onder de garantie.
        </p>
        <p>
          Komen we er samen niet uit, dan kun je terecht bij de Consumentenombudsdienst
          (consumentenombudsdienst.be).
        </p>
      </LegalSection>

      <LegalSection title="9. Aansprakelijkheid">
        <p>
          Belise werkt zorgvuldig en met professionele producten. Belise is niet aansprakelijk voor
          een reactie die je had kunnen vermijden door informatie te melden zoals bedoeld in punt 7.
          Deze beperking geldt niet bij opzet of zware fout van Belise, en doet geen afbreuk aan je
          wettelijke rechten als consument.
        </p>
      </LegalSection>

      <LegalSection title="10. Foto's">
        <p>
          Belise deelt enkel foto&apos;s van je resultaat op sociale media als je daar uitdrukkelijk
          toestemming voor gaf. Je kunt die toestemming altijd intrekken. Lees meer in onze{' '}
          <Link href="/privacy" className="text-accent-dark underline underline-offset-4">
            privacyverklaring
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Toepasselijk recht">
        <p>
          Op deze voorwaarden is het Belgisch recht van toepassing. Bij een geschil zijn de
          rechtbanken bevoegd volgens de gewone regels van bevoegdheid, die je als consument
          beschermen.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
