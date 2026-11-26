/**
 * Behandelingen die niet samen in één afspraak kunnen, omdat het overlappende pakketten zijn.
 * Binnen één set kies je er hoogstens één. Kiest een klant een tweede, dan wordt de eerste vervangen.
 * Een behandeling mag in meerdere sets staan (bv. "Benen volledig").
 */
export type ConflictSet = { id: string; reason: string; ids: readonly string[] };

export const CONFLICT_SETS: readonly ConflictSet[] = [
  {
    id: 'handen',
    reason: 'Je kiest één behandeling voor je handen: elke set is een volledig pakket.',
    ids: [
      'gelnagels-nieuwe-set',
      'gelnagels-nieuwe-set-verlenging',
      'gelnagels-bijwerking-4-weken',
      'gelnagels-bijwerking-plus-4-weken',
      'manicure',
      'manicure-lakken',
      'verwijderen-gelnagels-biab-manicure',
    ],
  },
  {
    id: 'onderbenen',
    reason: '"Benen volledig" bevat de onderbenen al.',
    ids: ['benen-volledig', 'onderbenen'],
  },
  {
    id: 'bovenbenen',
    reason: '"Benen volledig" bevat de bovenbenen al.',
    ids: ['benen-volledig', 'bovenbenen'],
  },
  {
    id: 'haar-basis',
    reason: 'Snit, kleur en brushing zijn pakketten: kies de combinatie die alles bevat wat je wilt.',
    ids: ['snit', 'snit-brushing', 'kleur-snit', 'kleur-brushing', 'kleur-snit-brushing', 'brushing'],
  },
  {
    id: 'haar-licht',
    reason: 'Je kiest één lichttechniek: mèches of balayage, volledig of deels.',
    ids: ['mesches-volledig', 'mesches-deels', 'balayage-volledig', 'balayage-deels'],
  },
];

/** Gekozen behandelingen die niet samen kunnen met `id`. */
export function conflictsWith(id: string, selectedIds: readonly string[]): string[] {
  const out = new Set<string>();
  for (const set of CONFLICT_SETS) {
    if (!set.ids.includes(id)) continue;
    for (const other of selectedIds) {
      if (other !== id && set.ids.includes(other)) out.add(other);
    }
  }
  return [...out];
}

/** Reden waarom `id` niet samen kan met `otherId` (eerste passende set). */
export function conflictReason(id: string, otherId: string): string | null {
  return CONFLICT_SETS.find((set) => set.ids.includes(id) && set.ids.includes(otherId))?.reason ?? null;
}

/**
 * Voegt `id` toe of haalt het weg. Botst het met eerder gekozen behandelingen,
 * dan vervangen we die. `replaced` bevat wat er wegviel.
 */
export function toggleWithRules(
  selectedIds: readonly string[],
  id: string,
): { next: string[]; replaced: string[]; added: boolean } {
  if (selectedIds.includes(id)) {
    return { next: selectedIds.filter((other) => other !== id), replaced: [], added: false };
  }
  const replaced = conflictsWith(id, selectedIds);
  return {
    next: [...selectedIds.filter((other) => !replaced.includes(other)), id],
    replaced,
    added: true,
  };
}

/** Maakt een (bv. uit de URL) ingelezen lijst geldig: bij botsingen wint de laatste. */
export function sanitizeSelection(ids: readonly string[]): string[] {
  return ids.reduce<string[]>((acc, id) => (acc.includes(id) ? acc : toggleWithRules(acc, id).next), []);
}
