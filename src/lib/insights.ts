import { addDaysToDateString, toDateString } from '@/lib/date';
import type { SkinEntry } from '@/lib/queries/skin';

/**
 * Auswertung eigener Daten über längere Zeiträume.
 *
 * Grundsatz: Hier entstehen ausschliesslich *Beobachtungen* zu
 * Zusammenhängen in den eigenen Aufzeichnungen — keine Kausalaussagen.
 * Jede Beobachtung trägt ihre Stichprobengrösse und eine ehrliche
 * Einschätzung, wie belastbar sie ist.
 */

/** Ab wie vielen Tagen pro Gruppe ein Vergleich überhaupt gezeigt wird. */
export const MIN_GROUP_DAYS = 5;
/** Ab wie vielen Tagen pro Gruppe wir von einem robusteren Signal sprechen. */
const SOLID_GROUP_DAYS = 12;
/** Unterschiede darunter gelten als Rauschen (Skin-Score-Punkte). */
const NOISE_THRESHOLD = 2;

export type Strength = 'insufficient' | 'weak' | 'moderate';

export interface Observation {
  id: string;
  /** Worum es geht, z. B. "Tage mit stark verarbeiteten Lebensmitteln". */
  label: string;
  /** Ø Score in der Gruppe. */
  withAverage: number;
  /** Ø Score an den übrigen Tagen. */
  withoutAverage: number;
  /** Differenz (mit – ohne), gerundet. */
  delta: number;
  withDays: number;
  withoutDays: number;
  strength: Strength;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function strengthOf(withDays: number, withoutDays: number, delta: number): Strength {
  const smallest = Math.min(withDays, withoutDays);
  if (smallest < MIN_GROUP_DAYS) return 'insufficient';
  if (Math.abs(delta) < NOISE_THRESHOLD) return 'weak';
  return smallest >= SOLID_GROUP_DAYS ? 'moderate' : 'weak';
}

/**
 * Vergleicht den Ø Score an Tagen mit und ohne ein Merkmal.
 * Gibt `null` zurück, wenn eine Gruppe leer ist.
 */
export function compareGroups(
  id: string,
  label: string,
  scoresByDate: Map<string, number>,
  markedDates: Set<string>
): Observation | null {
  const withScores: number[] = [];
  const withoutScores: number[] = [];

  for (const [date, score] of scoresByDate) {
    if (markedDates.has(date)) withScores.push(score);
    else withoutScores.push(score);
  }

  if (withScores.length === 0 || withoutScores.length === 0) return null;

  const withAverage = average(withScores);
  const withoutAverage = average(withoutScores);
  const delta = Math.round(withAverage - withoutAverage);

  return {
    id,
    label,
    withAverage: Math.round(withAverage),
    withoutAverage: Math.round(withoutAverage),
    delta,
    withDays: withScores.length,
    withoutDays: withoutScores.length,
    strength: strengthOf(withScores.length, withoutScores.length, delta),
  };
}

/**
 * Die Haut reagiert verzögert. Ein Merkmal an Tag D wird deshalb dem
 * Hautbild an Tag D+lag zugeordnet.
 */
export function shiftDates(dates: Iterable<string>, lagDays: number): Set<string> {
  const shifted = new Set<string>();
  for (const date of dates) shifted.add(addDaysToDateString(date, lagDays));
  return shifted;
}

export const FOOD_LAG_DAYS = 2;

export interface FoodProperties {
  sugar?: 'low' | 'medium' | 'high';
  dairy?: boolean;
  fat?: 'low' | 'medium' | 'high';
  processed?: 'minimal' | 'moderate' | 'highly';
  carbs?: 'low' | 'medium' | 'high';
  protein?: 'low' | 'medium' | 'high';
}

/** Merkmale, auf die wir Ernährungstage hin auswerten. */
const FOOD_MARKERS: { id: string; label: string; matches: (p: FoodProperties) => boolean }[] = [
  { id: 'sugar', label: 'Tage mit zuckerreichen Mahlzeiten', matches: (p) => p.sugar === 'high' },
  { id: 'dairy', label: 'Tage mit Milchprodukten', matches: (p) => p.dairy === true },
  {
    id: 'processed',
    label: 'Tage mit stark verarbeiteten Lebensmitteln',
    matches: (p) => p.processed === 'highly',
  },
  { id: 'fat', label: 'Tage mit fettreichen Mahlzeiten', matches: (p) => p.fat === 'high' },
];

export interface MealWithProperties {
  date: string;
  properties: unknown;
}

function asFoodProperties(value: unknown): FoodProperties | null {
  if (!value || typeof value !== 'object') return null;
  return value as FoodProperties;
}

/** Wie viele Mahlzeiten überhaupt eine KI-Analyse haben. */
export function analysedMealCount(mealsData: MealWithProperties[]): number {
  return mealsData.filter((m) => asFoodProperties(m.properties) !== null).length;
}

export function foodObservations(
  skinEntries: SkinEntry[],
  mealsData: MealWithProperties[]
): Observation[] {
  const scoresByDate = scoreMap(skinEntries);
  if (scoresByDate.size === 0) return [];

  const observations: Observation[] = [];

  for (const marker of FOOD_MARKERS) {
    const markedDates = new Set<string>();
    for (const meal of mealsData) {
      const props = asFoodProperties(meal.properties);
      if (props && marker.matches(props)) markedDates.add(meal.date);
    }
    if (markedDates.size === 0) continue;

    const observation = compareGroups(
      marker.id,
      marker.label,
      scoresByDate,
      shiftDates(markedDates, FOOD_LAG_DAYS)
    );
    if (observation) observations.push(observation);
  }

  return observations.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function routineObservation(
  skinEntries: SkinEntry[],
  complianceSeries: { date: string; rate: number }[]
): Observation | null {
  const scoresByDate = scoreMap(skinEntries);
  if (scoresByDate.size === 0) return null;

  const fullDays = new Set(
    complianceSeries.filter((d) => d.rate >= 1).map((d) => d.date)
  );
  if (fullDays.size === 0) return null;

  // Nur Tage bewerten, für die überhaupt eine Routine geplant war.
  const plannedDates = new Set(complianceSeries.map((d) => d.date));
  const relevantScores = new Map<string, number>();
  for (const [date, score] of scoresByDate) {
    if (plannedDates.has(date)) relevantScores.set(date, score);
  }

  return compareGroups(
    'routine',
    'Tage mit vollständig erledigter Routine',
    relevantScores,
    shiftDates(fullDays, 1)
  );
}

/** Score je Tag; bei mehreren Analysen zählt die letzte des Tages. */
export function scoreMap(entries: SkinEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of entries) {
    if (entry.score == null) continue;
    map.set(entry.date, entry.score);
  }
  return map;
}

export interface TrendSummary {
  currentAverage: number | null;
  previousAverage: number | null;
  delta: number | null;
  dataPoints: number;
}

/** Vergleicht den Zeitraum mit dem gleich langen davor. */
export function trendSummary(
  entries: SkinEntry[],
  startDate: string,
  endDate: string
): TrendSummary {
  const scores = scoreMap(entries);
  const midpoint = addDaysToDateString(
    startDate,
    Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000 / 2)
  );

  const previous: number[] = [];
  const current: number[] = [];
  for (const [date, score] of scores) {
    if (date < midpoint) previous.push(score);
    else current.push(score);
  }

  const currentAverage = current.length > 0 ? Math.round(average(current)) : null;
  const previousAverage = previous.length > 0 ? Math.round(average(previous)) : null;

  return {
    currentAverage,
    previousAverage,
    delta:
      currentAverage !== null && previousAverage !== null
        ? currentAverage - previousAverage
        : null,
    dataPoints: scores.size,
  };
}

/** Wie viele Tage im Zeitraum überhaupt ein Hautfoto haben. */
export function coverage(entries: SkinEntry[], days: number): number {
  const dates = new Set(entries.map((e) => e.date));
  return days > 0 ? dates.size / days : 0;
}

export function todayString(): string {
  return toDateString(new Date());
}
