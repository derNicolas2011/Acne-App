/** Mahlzeitentypen der App — Schweizer Bezeichnungen. */
export const MEAL_TYPES = [
  { id: 'Frühstück', emoji: '🍞', label: 'Frühstück', primary: true },
  { id: 'Znüni', emoji: '🥐', label: 'Znüni', primary: false },
  { id: 'Mittagessen', emoji: '🍽️', label: 'Mittagessen', primary: true },
  { id: 'Zvieri', emoji: '🍎', label: 'Zvieri', primary: false },
  { id: 'Abendessen', emoji: '🥘', label: 'Abendessen', primary: true },
  { id: 'Snack', emoji: '🍫', label: 'Snack', primary: false },
  { id: 'Getränk', emoji: '🥤', label: 'Getränk', primary: false },
] as const;

export type MealTypeId = (typeof MEAL_TYPES)[number]['id'];

export const MEAL_TYPE_IDS = MEAL_TYPES.map((t) => t.id) as readonly string[];

export function mealType(id: string) {
  return MEAL_TYPES.find((t) => t.id === id);
}

export function mealEmoji(id: string): string {
  return mealType(id)?.emoji ?? '🍽️';
}

export function isMealType(id: unknown): id is MealTypeId {
  return typeof id === 'string' && MEAL_TYPE_IDS.includes(id);
}

/**
 * Der Zeitpunkt bestimmt, welche Mahlzeit beim Erfassen vorgeschlagen wird —
 * spart auf dem Handy einen Tap.
 */
export function suggestedMealType(hour: number): MealTypeId {
  if (hour < 10) return 'Frühstück';
  if (hour < 11) return 'Znüni';
  if (hour < 14) return 'Mittagessen';
  if (hour < 17) return 'Zvieri';
  if (hour < 21) return 'Abendessen';
  return 'Snack';
}
