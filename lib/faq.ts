import { SALON } from '@/lib/salon';

export type FaqItem = { question: string; answer: string };

/**
 * Veelgestelde vragen, op basis van de antwoorden van de zaakvoerder (26/11/2026).
 * Verschijnt op /behandelingen, als FAQPage-schema en in llms-full.txt.
 */
export const FAQ: readonly FaqItem[] = [
  {
    question: 'Hoe lang houden gelnagels?',
    answer: 'Gemiddeld vier weken. Daarna kies je voor een bijwerking of een nieuwe set.',
  },
  {
    question: 'Er is een nagel afgebroken. Wat nu?',
    answer: 'Breekt er binnen een week na je behandeling een gelnagel af, dan mag je langskomen voor een gratis herstel.',
  },
  {
    question: 'Mag ik komen met nagels van een andere salon?',
    answer:
      'Zeker. Omdat de verwijdermethode dan vooraf niet vastligt, rekenen we een supplement van €5. Voeg het supplement toe wanneer je je nagelbehandeling boekt.',
  },
  {
    question: 'Hoe lang moeten mijn haartjes zijn voor een waxbeurt?',
    answer: 'Minstens 1 cm, zodat de wax ze goed kan vastnemen. Kom met een propere, verzorgde huid.',
  },
  {
    question: 'Wordt mijn haar gewassen?',
    answer:
      'Voor een gewone snit wordt je haar niet ter plaatse gewassen. Bij brushing en balayage wel.',
  },
  {
    question: 'Hoe kan ik betalen?',
    answer: SALON.payment,
  },
  {
    question: 'Ik ben te laat. Kan mijn afspraak nog doorgaan?',
    answer:
      'Laat het zo snel mogelijk weten via WhatsApp of Instagram. Belise bekijkt per geval wat nog mogelijk is.',
  },
  {
    question: 'Ik vind geen vrij moment. Wat nu?',
    answer:
      'Belise zet de agenda telkens open voor de komende weken. Wil je verder vooruit plannen, stuur dan gerust een bericht via WhatsApp, Instagram of mail.',
  },
  {
    question: 'Waar kan ik parkeren?',
    answer: SALON.parking,
  },
  {
    question: 'Verkopen jullie cadeaubonnen?',
    answer: 'Ja. Een cadeaubon blijft één jaar geldig. Vraag er gerust naar via WhatsApp of Instagram.',
  },
];
