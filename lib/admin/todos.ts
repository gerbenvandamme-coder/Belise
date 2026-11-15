/**
 * To-dolijst in het beheerpaneel. De inhoud staat hier in de code; welke taken afgevinkt zijn,
 * staat in public.site_settings onder de sleutel 'admin_todo_done' (lijst van ids).
 * Nieuwe taak: voeg een item toe met een unieke id. Ids nooit hergebruiken.
 */

export type TodoOwner = 'eigenares' | 'ontwikkelaar' | 'samen';

export type TodoItem = {
  id: string;
  title: string;
  owner: TodoOwner;
  /** 1 = eerst doen, 2 = belangrijk, 3 = later. */
  priority: 1 | 2 | 3;
  why: string;
  /** Concrete stappen of vragen. */
  steps: readonly string[];
  /** Waar het in de site terechtkomt of waar je het regelt. */
  where?: string;
};

export type TodoGroup = { id: string; title: string; intro: string; items: readonly TodoItem[] };

export const TODO_SETTING_KEY = 'admin_todo_done';

export const OWNER_LABEL: Record<TodoOwner, string> = {
  eigenares: 'Eigenares',
  ontwikkelaar: 'Ontwikkelaar',
  samen: 'Samen',
};

export const TODO_GROUPS: readonly TodoGroup[] = [
  {
    id: 'livegang',
    title: 'Technische livegang',
    intro:
      'Zonder deze stappen werken inloggen, boeken, berichten en dit beheerpaneel niet. Dit regelt de ontwikkelaar; de eigenares hoeft enkel toegang te geven.',
    items: [
      {
        id: 'supabase-project',
        title: 'Supabase-project aanmaken in de EU, op naam van de salon',
        owner: 'samen',
        priority: 1,
        why: 'De database met klantgegevens hoort bij de salon. Wie het Supabase-account heeft, kan alle gegevens zien; daarom op naam van de salon, met de ontwikkelaar als uitgenodigd lid.',
        steps: [
          'Eigenares maakt een account op supabase.com met het e-mailadres van de salon.',
          'Nieuw project: regio "Central EU (Frankfurt)", sterk databasewachtwoord bewaren in een wachtwoordbeheerder.',
          'Ontwikkelaar uitnodigen via Organization → Team (rol Developer).',
        ],
        where: 'supabase.com',
      },
      {
        id: 'migraties',
        title: 'Databasestructuur installeren (8 migraties)',
        owner: 'ontwikkelaar',
        priority: 1,
        why: 'Maakt de tabellen, beveiligingsregels en opslagmappen aan.',
        steps: [
          'Supabase → SQL Editor, de bestanden uit supabase/migrations/ in deze volgorde uitvoeren:',
          '1 init_belise · 2 whitelist_availability · 3 whitelist_create_booking · 4 admin_services_site_settings',
          '5 harden_bookings · 6 nail_design_and_massage · 7 portfolio_and_messages · 8 portfolio_frames',
          'Alles is herhaalbaar: opnieuw uitvoeren kan geen kwaad.',
        ],
        where: 'Supabase → SQL Editor',
      },
      {
        id: 'vercel-keys',
        title: 'Supabase-sleutels in Vercel zetten',
        owner: 'ontwikkelaar',
        priority: 1,
        why: 'De website weet anders niet met welke database ze moet praten.',
        steps: [
          'Supabase → Project Settings → API: kopieer de Project URL en de "anon public" key.',
          'Vercel → project belise → Settings → Environment Variables (Production): NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY.',
          'Nooit de service_role-sleutel in Vercel zetten.',
          'Daarna opnieuw deployen (Deployments → Redeploy).',
        ],
        where: 'Vercel → Settings → Environment Variables',
      },
      {
        id: 'auth-urls',
        title: 'Inloglinks juist instellen',
        owner: 'ontwikkelaar',
        priority: 1,
        why: 'De magische inloglink in de mail moet terugleiden naar de site.',
        steps: [
          'Supabase → Authentication → URL Configuration.',
          'Site URL: https://belise.vercel.app (of later het eigen domein).',
          'Redirect URL toevoegen: https://belise.vercel.app/auth/callback.',
        ],
        where: 'Supabase → Authentication',
      },
      {
        id: 'admin-rol',
        title: 'Eigenares beheerder maken',
        owner: 'samen',
        priority: 1,
        why: 'Pas dan opent dit beheerpaneel voor haar.',
        steps: [
          'Eigenares registreert zich via /account met haar eigen e-mailadres.',
          "Ontwikkelaar voert in de SQL Editor uit: update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'HAAR-EMAIL');",
          'Eigenares logt uit en opnieuw in; /admin opent.',
        ],
      },
      {
        id: 'regio-eu',
        title: 'Serverfuncties in Europa laten draaien (Amerikaanse servers vermijden)',
        owner: 'ontwikkelaar',
        priority: 2,
        why: 'Vercel draait nu standaard in Washington (iad1). De klantgegevens zelf staan in Frankfurt, maar het is netter en sneller als ook de site-functies in de EU draaien.',
        steps: [
          'Vercel → project belise → Settings → Functions → Function Region: Frankfurt (fra1).',
          'Opnieuw deployen en controleren dat de deployment "fra1" toont.',
          'Nakijken of Vercel en Supabase onder het EU-VS Data Privacy Framework vallen of standaardcontractbepalingen (SCC) bieden, en dat vermelden in de privacyverklaring.',
        ],
        where: 'Vercel → Settings → Functions',
      },
      {
        id: 'domein',
        title: 'Eigen domein koppelen (bv. belise.be)',
        owner: 'samen',
        priority: 2,
        why: 'Een eigen domein oogt professioneler en telt mee voor Google en AI-assistenten.',
        steps: [
          'Domein registreren op naam van de zaak (bv. via een Belgische registrar).',
          'Vercel → Settings → Domains → domein toevoegen en de DNS-records instellen die Vercel toont.',
          'In Vercel de variabele NEXT_PUBLIC_SITE_URL op https://www.belise.be zetten en de Supabase-URL’s (taak hierboven) aanpassen.',
        ],
      },
      {
        id: 'testronde',
        title: 'Volledige testronde',
        owner: 'samen',
        priority: 1,
        why: 'Elke stap één keer echt doorlopen voor klanten de site gebruiken.',
        steps: [
          'Beschikbaarheid: een dag openzetten.',
          'Als klant: account maken, afspraak boeken (ook via "Boek dit design" in de nageldesigner), foto toevoegen.',
          'Bericht sturen via /contact en beantwoorden in Berichten.',
          'Portfoliofoto opladen met tags en bekijken op /portfolio.',
          'Account verwijderen testen met een testaccount.',
        ],
      },
    ],
  },
  {
    id: 'inhoud',
    title: 'Inhoud van de site',
    intro:
      'Teksten en gegevens die enkel jij kunt aanleveren. Schrijf ze gewoon in je eigen woorden (een notitie of spraakbericht is genoeg); de ontwikkelaar zet ze op de site.',
    items: [
      {
        id: 'contact',
        title: 'Contactgegevens doorgeven',
        owner: 'eigenares',
        priority: 1,
        why: 'Tot dan staan de knoppen Bellen, Sms, WhatsApp en Mail op "volgt binnenkort".',
        steps: [
          'Telefoonnummer zoals het op de site mag staan (bv. 0470 12 34 56).',
          'Is dat ook je WhatsApp-nummer? Zo niet: welk nummer voor WhatsApp?',
          'E-mailadres voor klanten (liefst een adres van de zaak, niet privé).',
        ],
        where: 'Pagina Contact, footer, Google',
      },
      {
        id: 'faq',
        title: 'Veelgestelde vragen beantwoorden',
        owner: 'eigenares',
        priority: 1,
        why: 'Een FAQ is wat Google en AI-assistenten (ChatGPT, Gemini) het vaakst letterlijk overnemen. Kort en eerlijk antwoorden, 1–3 zinnen per vraag.',
        steps: [
          'Hoe lang houden gelnagels en BIAB gemiddeld?',
          'Wat is het verschil tussen BIAB en gelnagels, en wat raad je wie aan?',
          'Mag ik met nagels van een andere salon komen? Kost verwijderen extra?',
          'Hoe lang moet mijn haar zijn voor een waxbeurt, en wat doe ik best vooraf?',
          'Hoe annuleer of verplaats ik een afspraak, en tot wanneer kan dat kosteloos?',
          'Hoe kan ik betalen (cash, Payconiq, Bancontact)?',
          'Waar kan ik parkeren?',
          'Kan ik een cadeaubon kopen?',
          'Werk je met afspraak op zaterdag of ’s avonds?',
          'Wat als ik te laat ben?',
        ],
        where: 'Nieuwe FAQ-sectie op de site',
      },
      {
        id: 'uitleg-behandelingen',
        title: 'Korte uitleg per behandeling',
        owner: 'eigenares',
        priority: 1,
        why: 'Nu staan er bijna enkel prijzen. Twee à drie zinnen per groep helpt klanten kiezen en verhoogt de score bij Google.',
        steps: [
          'Gelnagels: wat is het, hoe lang houdt het, wanneer bijwerken?',
          'BIAB: voor wie is het ideaal, verschil met gel, "op tenen"?',
          'Manicure & verwijderen: wat zit er in een manicure?',
          'Ontharing: welke wax gebruik je, hoe lang blijft het glad, nazorg?',
          'Snit & kleuring / mèches / balayage: verschil tussen mèches en balayage, wat is "deels"?',
          'Brushing: wat bepaalt kort/midden/lang?',
          'Massage: welke massages ga je aanbieden, met prijs en duur?',
        ],
        where: 'Pagina Behandelingen',
      },
      {
        id: 'over',
        title: 'Je eigen verhaal voor de Over-pagina',
        owner: 'eigenares',
        priority: 1,
        why: 'Klanten (en Google) willen weten wie er achter de zaak zit. Dit maakt de grootste indruk van alle teksten.',
        steps: [
          'Je naam zoals die op de site mag staan.',
          'Hoe ben je begonnen en sinds wanneer werk je als schoonheidsspecialiste / nagelstyliste / kapster?',
          'Welke opleidingen of certificaten heb je (school, cursussen, merken)?',
          'Waar sta je voor: wat moet een klant voelen als ze buitengaat?',
          'Met welke producten of merken werk je, en waarom?',
          'Twee à vier foto’s van de salon (inkom, werkplek, detail).',
        ],
        where: 'Pagina Over',
      },
      {
        id: 'werkuren',
        title: 'Werkdagen en tijdvakken',
        owner: 'eigenares',
        priority: 2,
        why: 'Ook "enkel op afspraak" kan Google tonen als je de gewone werkdagen noemt.',
        steps: [
          'Op welke dagen werk je meestal (bv. di–za)?',
          'Ongeveer tussen welke uren?',
          'Vaste sluitingsperiodes (vakantie)?',
        ],
        where: 'Footer, Contact, Google',
      },
      {
        id: 'prijzen-nakijken',
        title: 'Prijzen en duurtijden nakijken',
        owner: 'eigenares',
        priority: 2,
        why: 'De agenda plant op basis van de duur; een te korte duur geeft overboekingen.',
        steps: [
          'Tab "Tarieven & site": elke behandeling nalopen op prijs en duur.',
          'Brushing kort/midden/lang: prijslijst zegt 35-30-40, site toont 30-35-40. Wat klopt?',
          'Decemberactie: tellen per behandeling (zo gebouwd) of per bezoek?',
        ],
        where: 'Tab Tarieven & site',
      },
      {
        id: 'portfolio',
        title: 'Portfolio vullen',
        owner: 'eigenares',
        priority: 2,
        why: 'Echte resultaten overtuigen meer dan tekst.',
        steps: [
          'Per categorie minstens 6 foto’s opladen in tab Portfolio, met een titel en tags (bv. french, chroom, nude).',
          'Uitgeknipte PNG’s komen zonder kader het mooist uit; het kader stel je per categorie in.',
          'Enkel foto’s waarvoor de klant toestemming gaf (zie juridisch).',
        ],
        where: 'Tab Portfolio',
      },
      {
        id: 'fotos',
        title: 'Betere foto’s',
        owner: 'eigenares',
        priority: 3,
        why: 'De hoofdfoto is klein (337 px breed) en wordt wat zacht op grote schermen.',
        steps: [
          'Originele hoofdfoto in volle resolutie bezorgen.',
          'Foto voor de categorie Massage zodra die er is.',
        ],
      },
    ],
  },
  {
    id: 'zichtbaarheid',
    title: 'Gevonden worden (Google en AI)',
    intro:
      'De technische basis staat (robots.txt, sitemap, llms.txt, gestructureerde gegevens). Dit zijn de stappen die daarbovenop het verschil maken.',
    items: [
      {
        id: 'google-profiel',
        title: 'Google-bedrijfsprofiel aanmaken',
        owner: 'eigenares',
        priority: 1,
        why: 'Bepaalt of je verschijnt bij "nagelsalon Opwijk" in Google Maps en in AI-antwoorden.',
        steps: [
          'business.google.com → zaak toevoegen: "Belise Beauty", categorie Nagelsalon (+ Schoonheidssalon, Kapper).',
          'Adres exact zoals op de site: Nanovestraat 71, 1745 Opwijk.',
          'Website-link en boekingslink (/booking) invullen, foto’s toevoegen.',
          'Na verificatie de link doorgeven aan de ontwikkelaar (komt in de gestructureerde gegevens).',
        ],
        where: 'business.google.com',
      },
      {
        id: 'reviews',
        title: 'Echte reviews verzamelen',
        owner: 'eigenares',
        priority: 2,
        why: 'Reviews wegen zwaar voor lokale zoekresultaten. Enkel echte klanten vragen; niets zelf schrijven of laten schrijven.',
        steps: [
          'Na een afspraak de reviewlink van het Google-profiel delen (bv. via WhatsApp).',
          'Reageer kort en vriendelijk op elke review.',
        ],
      },
      {
        id: 'instagram-link',
        title: 'Website in je Instagram-bio',
        owner: 'eigenares',
        priority: 2,
        why: 'Verbindt je Instagram met de site; zoekmachines zien dan dat ze bij elkaar horen.',
        steps: ['Instagram → profiel bewerken → link: de website (of rechtstreeks /booking).'],
      },
      {
        id: 'gidsen',
        title: 'Een paar korte gidsartikelen',
        owner: 'samen',
        priority: 3,
        why: 'AI-assistenten verwijzen graag naar duidelijke uitleg van een vakvrouw.',
        steps: [
          'Onderwerpen kiezen, bv. "BIAB of gelnagels?", "Voorbereiden op een waxbeurt", "Balayage of mèches?".',
          'Eigenares vertelt de inhoud, ontwikkelaar maakt er een pagina van.',
        ],
      },
    ],
  },
  {
    id: 'juridisch',
    title: 'Juridisch en privacy',
    intro: 'De voorwaarden en privacyverklaring staan als concept online. Deze punten moeten nog ingevuld of nagekeken worden.',
    items: [
      {
        id: 'bedrijfsgegevens',
        title: 'Bedrijfsgegevens invullen',
        owner: 'eigenares',
        priority: 1,
        why: 'Wettelijk verplicht op de site (WER, art. III.74).',
        steps: [
          'Volledige naam zaakvoerder en rechtsvorm (eenmanszaak of vennootschap).',
          'Ondernemingsnummer (KBO).',
          'Btw-nummer, of vermelding vrijstelling kleine onderneming (art. 56bis WBTW).',
        ],
        where: 'Algemene voorwaarden, privacyverklaring, footer',
      },
      {
        id: 'annulering',
        title: 'Annuleringsbeleid vastleggen',
        owner: 'samen',
        priority: 1,
        why: 'Staat nu als placeholder. Moet ook kloppen met het herroepingsrecht bij online boeken (art. VI.47 e.v. WER).',
        steps: [
          'Tot hoeveel uur vooraf kosteloos annuleren?',
          'Wat bij te laat annuleren of niet komen (no-show)?',
          'Wil je ooit een voorschot vragen?',
          'Ontwikkelaar laat de tekst juridisch nakijken.',
        ],
        where: 'Algemene voorwaarden',
      },
      {
        id: 'bewaartermijnen',
        title: 'Bewaartermijnen kiezen',
        owner: 'eigenares',
        priority: 2,
        why: 'De privacywet vraagt dat je zegt hoe lang je gegevens bijhoudt.',
        steps: [
          'Afspraken en salonnotities: bv. 3 jaar na de laatste afspraak?',
          'Foto’s bij een boeking: bv. 12 maanden na de afspraak?',
        ],
        where: 'Privacyverklaring',
      },
      {
        id: 'privacy-hosting',
        title: 'Privacyverklaring bijwerken: hosting en doorgifte buiten de EU',
        owner: 'ontwikkelaar',
        priority: 1,
        why: 'De verklaring noemt nog Cloudflare, maar de site draait op Vercel. Ook de doorgifte naar de VS (DPF of SCC) moet correct vermeld staan.',
        steps: [
          'Cloudflare vervangen door Vercel Inc. (hosting).',
          'Nakijken onder welke regeling Vercel en Supabase gegevens buiten de EU kunnen raadplegen en dat vermelden.',
          'Verwerkersovereenkomsten (DPA) van Vercel en Supabase accepteren en bewaren.',
        ],
        where: 'Privacyverklaring',
      },
      {
        id: 'toestemming-fotos',
        title: 'Toestemming voor portfoliofoto’s',
        owner: 'eigenares',
        priority: 2,
        why: 'De portfoliofoto’s zijn publiek. Een herkenbare hand of gezicht vraagt toestemming van de klant.',
        steps: [
          'Vraag het telkens kort (WhatsApp-bericht met "ja" volstaat als bewijs).',
          'Liefst geen herkenbare tatoeages, juwelen of gezichten.',
        ],
      },
      {
        id: 'verwerker',
        title: 'Afspraken met de ontwikkelaar (verwerkersovereenkomst)',
        owner: 'samen',
        priority: 2,
        why: 'De ontwikkelaar kan bij technisch werk klantgegevens zien. De AVG vraagt dan een schriftelijke overeenkomst (art. 28).',
        steps: [
          'Ontwikkelaar bezorgt een korte verwerkersovereenkomst.',
          'Later: aparte rol "support" met enkel toegang tot website-inhoud, en tijdelijke toegang tot klantgegevens die de eigenares zelf aan- en uitzet.',
        ],
      },
      {
        id: 'december',
        title: 'Formule decemberactie laten nakijken',
        owner: 'ontwikkelaar',
        priority: 3,
        why: 'Een trekking met aankoopplicht is in België verboden (loterijwet). De teller zonder trekking is gebouwd; de communicatie moet daar ook bij passen.',
        steps: ['Actievoorwaarden opstellen en juridisch laten nakijken voor ze online gaan.'],
      },
    ],
  },
  {
    id: 'later',
    title: 'Later uitbreiden',
    intro: 'Bewust uitgesteld. Pas aan beginnen als de basis goed loopt.',
    items: [
      {
        id: 'mails',
        title: 'Automatische e-mails bij boeken en bevestigen',
        owner: 'ontwikkelaar',
        priority: 3,
        why: 'Nu ziet de klant de status enkel in zijn account.',
        steps: ['Afzenderadres van de zaak nodig (eigen domein).', 'Kiezen welke mails: ontvangen, bevestigd, herinnering, geannuleerd.'],
      },
      {
        id: 'voorschot',
        title: 'Voorschot of no-showbeleid in de boeking',
        owner: 'samen',
        priority: 3,
        why: 'Enkel als no-shows een probleem blijken.',
        steps: ['Beslissing eigenares, daarna betaalprovider kiezen (bv. Mollie).'],
      },
      {
        id: 'inwerktijd',
        title: 'Slimme planning met inwerktijd (fase 5)',
        owner: 'ontwikkelaar',
        priority: 3,
        why: 'Tijdens de inwerktijd van bv. kleuring kan een korte behandeling ingepland worden.',
        steps: ['Pas na een paar weken echte boekingen.'],
      },
    ],
  },
];
