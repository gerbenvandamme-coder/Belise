/**
 * Extra uitleg in het info-venster op /behandelingen.
 * CONCEPTTEKST: algemene uitleg, nog na te lezen en aan te vullen door de eigenares
 * (zie To-do "Korte uitleg per behandeling"). Pas hier gerust de woorden aan.
 */

export type InfoBlock = {
  /** Eén tot drie zinnen: wat is het. */
  description: string;
  /** Korte praktische punten. */
  tips?: readonly string[];
};

/** Uitleg per groep (of per categorie wanneer er geen groepen zijn). */
export const GROUP_INFO: Record<string, InfoBlock> = {
  Gelnagels: {
    description:
      'Gelnagels zijn een stevige laag gel op je natuurlijke nagel, eventueel met verlenging. Ze geven een strak, glanzend resultaat in de vorm en lengte die je kiest.',
    tips: [
      'Bij een bijwerking wordt de uitgroei opgevuld en de vorm opnieuw gezet.',
      'Kom je later dan de termijn in de naam, kies dan de bijwerking met "+".',
      'Gelnagels houden gemiddeld 4 weken.',
      'Breekt er binnen een week een nagel af? Dan herstellen we die gratis.',
      'Laat de toestand van je nagels of huid een behandeling niet toe, dan kan de schoonheidsspecialiste beslissen ze niet (opnieuw) uit te voeren.',
    ],
  },
  'Manicure & Verwijderen': {
    description:
      'Verzorging van handen en nagels: nagels vijlen en in vorm brengen, nagelriemen verzorgen en eventueel lakken. Ook voor het veilig verwijderen van gel.',
    tips: [
      'Laat gel altijd vakkundig verwijderen om je natuurlijke nagel te sparen.',
      'Kom je met nagels van een andere salon? Voeg dan het supplement van €5 toe: de verwijdermethode ligt vooraf niet vast.',
    ],
  },
  Ontharing: {
    description:
      'Ontharing met wax voor een gladde huid. De haartjes worden met de wortel verwijderd, waardoor het resultaat langer meegaat dan scheren.',
    tips: [
      'Je haartjes moeten minstens 1 cm lang zijn, zodat de wax ze goed kan vastnemen.',
      'Kom met een propere, verzorgde huid.',
      'Vermijd zon, sauna en scrubben vlak na de behandeling.',
    ],
  },
  'Snit & Kleuring': {
    description:
      'Een snit afgestemd op je haartype en gezicht, eventueel gecombineerd met een kleuring en brushing.',
    tips: [
      'De prijs hangt af van je haarlengte: kies kort, midden of lang bij het boeken.',
      'Kleuring doen we vanaf 16 jaar.',
    ],
  },
  'Technieken & Brushing': {
    description:
      'Mèches en balayage geven licht en diepte aan je haar. Bij mèches worden lokken van aan de inplant gekleurd, balayage geeft een zachtere, verlopen overgang.',
    tips: [
      '"Deels" betekent enkel de bovenkant of het gezicht; "volledig" het hele hoofd.',
      'Inwerktijd is inbegrepen in de geplande duur.',
      'Bij brushing en balayage wordt je haar ter plaatse gewassen.',
      'Mèches en balayage doen we vanaf 16 jaar.',
    ],
  },
  Massage: {
    description: 'Even helemaal tot rust komen. Het aanbod wordt binnenkort aangevuld.',
  },
};

/** Optionele extra zin per behandeling (sleutel = id). */
export const ITEM_NOTE: Record<string, string> = {
  'gelnagels-nieuwe-set': 'Een volledig nieuwe set op je natuurlijke nagellengte.',
  'gelnagels-nieuwe-set-verlenging': 'Nieuwe set waarbij je nagels verlengd worden tot de lengte die je kiest.',
  'gelnagels-bijwerking-4-weken': 'Bijwerking van een bestaande set tot 4 weken na de vorige afspraak.',
  'gelnagels-bijwerking-plus-4-weken': 'Bijwerking wanneer je vorige afspraak meer dan 4 weken geleden is.',
  manicure: 'Vijlen, vorm geven en nagelriemen verzorgen.',
  'manicure-lakken': 'Manicure afgewerkt met een gewone nagellak.',
  'verwijderen-gelnagels-biab-manicure': 'Veilig verwijderen van gel, gevolgd door een manicure.',
  'supplement-andere-salon':
    'Voor nagels die in een andere salon gezet zijn. Voeg dit toe aan je nagelbehandeling.',
  snit: 'Knippen. Je haar wordt niet ter plaatse gewassen.',
  'snit-brushing': 'Knippen en afwerken met een brushing.',
  'kleur-snit': 'Kleuring van de inplant of het hele haar, met snit.',
  'kleur-brushing': 'Kleuring afgewerkt met een brushing.',
  'kleur-snit-brushing': 'Het volledige pakket: kleur, snit en brushing.',
  'mesches-volledig': 'Mèches over het hele hoofd.',
  'mesches-deels': 'Mèches op een deel van het haar.',
  'balayage-volledig': 'Balayage over het hele hoofd.',
  'balayage-deels': 'Balayage op een deel van het haar.',
  brushing: 'Wassen en föhnen in model.',
};

export function infoFor(group: string): InfoBlock | undefined {
  return GROUP_INFO[group];
}
