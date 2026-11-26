import { CONTACT, SALON, isFilledIn } from '@/lib/salon';
import { FAQ } from '@/lib/faq';
import { NAIL_DESIGNER_ENABLED } from '@/lib/features';
import { fetchTreatmentCategories } from '@/lib/services';
import { createPublicSupabase } from '@/lib/supabasePublic';
import { CONTENT_UPDATED, PUBLIC_PAGES, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '@/lib/site';
import {
  TREATMENT_CATEGORIES,
  formatDurationRange,
  formatPriceRange,
  getDurationRange,
  getPriceRange,
  visibleCategories,
} from '@/lib/treatments';

async function categories() {
  const client = createPublicSupabase();
  return visibleCategories(client ? await fetchTreatmentCategories(client) : TREATMENT_CATEGORIES);
}

function contactLines(): string[] {
  const lines = [
    `- Adres: ${SALON.address.street}, ${SALON.address.postalCity}, België`,
    '- Werkwijze: enkel op afspraak; vrije momenten staan in de online agenda',
    `- Online boeken: ${absoluteUrl('/booking')}`,
    `- Instagram: ${SALON.instagram.url} (berichten via Instagram of WhatsApp)`,
  ];
  if (isFilledIn(CONTACT.phone)) lines.push(`- Telefoon: ${CONTACT.phone}`);
  if (isFilledIn(CONTACT.email)) lines.push(`- E-mail: ${CONTACT.email}`);
  return lines;
}

/** Korte gids voor AI-assistenten (llms.txt-standaard). */
export async function buildLlmsTxt(): Promise<string> {
  const cats = await categories();
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Laatst bijgewerkt: ${CONTENT_UPDATED}. Taal: Nederlands (België).`,
    '',
    '## Kerngegevens',
    ...contactLines(),
    `- Behandelingen: ${cats.map((c) => c.title.toLowerCase()).join(', ')}`,
    '',
    "## Pagina's",
    ...PUBLIC_PAGES.map((page) => `- [${page.name}](${absoluteUrl(page.path)}): ${page.description}`),
    '',
    '## Meer detail',
    `- [Volledige prijslijst en informatie](${absoluteUrl('/llms-full.txt')}): alle behandelingen met prijs en duur.`,
    '',
  ].join('\n');
}

/** Uitgebreide versie met de volledige prijslijst. */
export async function buildLlmsFullTxt(): Promise<string> {
  const cats = await categories();
  const out = [
    `# ${SITE_NAME} – volledige informatie`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Laatst bijgewerkt: ${CONTENT_UPDATED}. Prijzen in euro; Belise is vrijgesteld van btw. Richtprijzen: de definitieve prijs hangt af van lengte, design en het verwijderen van een oude set.`,
    '',
    '## Over de salon',
    'Belise is een beautysalon in Opwijk (Vlaams-Brabant, België). Elke behandeling gebeurt op afspraak, zodat er tijd is voor persoonlijk advies. Klanten boeken en beheren hun afspraken online met een account; bij het boeken kunnen ze foto\'s van hun huidige nagels of een inspiratiebeeld toevoegen.',
    '',
    '## Contact en ligging',
    ...contactLines(),
    `- Parkeren: ${SALON.parking}`,
    '',
    '## Behandelingen en tarieven',
  ];
  for (const category of cats) {
    out.push('', `### ${category.title}`, category.subtitle, '');
    for (const item of category.treatments) {
      const price = getPriceRange(item);
      const duration = getDurationRange(item);
      const variant = price.min === price.max ? '' : ' (afhankelijk van haarlengte kort/midden/lang)';
      out.push(
        `- ${item.group ? `${item.group}: ` : ''}${item.title} – ${formatPriceRange(price.min, price.max)}${variant}, ${formatDurationRange(duration.min, duration.max)}`,
      );
    }
  }
  out.push(
    '',
    '## Extra diensten op de website',
    ...(NAIL_DESIGNER_ENABLED
      ? [`- Nageldesigner (${absoluteUrl('/designer')}): test vorm (square, squoval, rond, ovaal, amandel, coffin), lengte, kleur, finish (glans, mat, chroom) en nail art (French, micro-French, ombre, polka dots) op een echte hand, en boek het ontwerp meteen.`]
      : []),
    `- Portfolio (${absoluteUrl('/portfolio')}): recent werk per behandeling, met stijllabels.`,
    '',
    '## Veelgestelde vragen',
    '- Kan ik zonder afspraak langskomen? Nee, Belise werkt enkel op afspraak.',
    `- Hoe boek ik? Online via ${absoluteUrl('/booking')}: kies een behandeling en een vrij moment.`,
    `- Waar is de salon? ${SALON.address.street}, ${SALON.address.postalCity}.`,
    ...FAQ.map((item) => `- ${item.question} ${item.answer}`),
    '',
  );
  return out.join('\n');
}
