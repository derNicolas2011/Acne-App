/**
 * Einheitliche Deutung des Skin Scores.
 *
 * Konvention: **höher ist besser** (100 = bestes Hautbild).
 * Diese Datei ist die einzige Stelle, an der diese Richtung interpretiert
 * wird — vorher widersprachen sich Dashboard und Detailansicht.
 */

export type Tone = 'positive' | 'caution' | 'alert' | 'neutral';

export const SCORE_MAX = 100;

/** Farbliche Einordnung eines Scores (0–100, höher = besser). */
export function scoreTone(score: number | null | undefined): Tone {
  if (score == null) return 'neutral';
  if (score >= 70) return 'positive';
  if (score >= 45) return 'caution';
  return 'alert';
}

/** Kurze verbale Einordnung — bewusst beschreibend, nicht wertend. */
export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return 'Kein Wert';
  if (score >= 85) return 'Sehr ruhig';
  if (score >= 70) return 'Ruhig';
  if (score >= 55) return 'Leicht gereizt';
  if (score >= 40) return 'Gereizt';
  return 'Deutlich gereizt';
}

/**
 * Einzelmetriken (Entzündung, Rötung, …) laufen von 0–10, dort ist
 * **niedriger besser** — genau umgekehrt zum Gesamtscore.
 */
export const METRIC_MAX = 10;

export function metricTone(value: number | null | undefined): Tone {
  if (value == null) return 'neutral';
  if (value <= 2) return 'positive';
  if (value <= 5) return 'caution';
  return 'alert';
}

/**
 * Läsionen und Mitesser sind Anzahlen ohne feste Obergrenze.
 * Für die Balkendarstellung deckeln wir bei einem sinnvollen Maximum.
 */
export const COUNT_SOFT_MAX = 25;

export function countTone(value: number | null | undefined): Tone {
  if (value == null) return 'neutral';
  if (value <= 3) return 'positive';
  if (value <= 10) return 'caution';
  return 'alert';
}

/** Eine Veränderung nach oben ist eine Verbesserung. */
export function deltaTone(delta: number | null | undefined): Tone {
  if (delta == null || delta === 0) return 'neutral';
  return delta > 0 ? 'positive' : 'alert';
}

/** Formatiert eine Score-Veränderung mit Vorzeichen, z. B. "+4". */
export function formatDelta(delta: number | null | undefined): string | null {
  if (delta == null) return null;
  if (delta === 0) return '±0';
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
}

export const TONE_TEXT: Record<Tone, string> = {
  positive: 'text-positive',
  caution: 'text-caution',
  alert: 'text-alert',
  neutral: 'text-muted-foreground',
};

export const TONE_BG: Record<Tone, string> = {
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  alert: 'bg-alert-soft text-alert',
  neutral: 'bg-muted text-muted-foreground',
};

export const TONE_STROKE: Record<Tone, string> = {
  positive: 'stroke-positive',
  caution: 'stroke-caution',
  alert: 'stroke-alert',
  neutral: 'stroke-muted-foreground',
};

/** Die deutschen Labels der KI-Vergleichswerte. */
export const COMPARISON_LABELS: Record<string, string> = {
  improved: 'Verbessert gegenüber dem letzten Foto',
  worsened: 'Stärker gereizt als beim letzten Foto',
  stable: 'Weitgehend unverändert',
  unknown: 'Kein Vergleich möglich',
};

export function comparisonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return COMPARISON_LABELS[value] ?? null;
}
