/**
 * Zentrale Datums-/Zeit-Helfer.
 *
 * Die App ist auf eine feste Zeitzone ausgelegt (Europe/Zurich). Auf Vercel
 * läuft der Server in UTC — ohne explizite Zeitzone würden Tagesgrenzen
 * verrutschen und Einträge dem falschen Tag zugeordnet.
 */

export const APP_TIMEZONE = 'Europe/Zurich';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIMEZONE,
  hour: 'numeric',
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat('de-CH', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

/** Aktuelles Datum in der App-Zeitzone als `YYYY-MM-DD`. */
export function today(): string {
  return dateFormatter.format(new Date());
}

/** Beliebiges Date als `YYYY-MM-DD` in der App-Zeitzone. */
export function toDateString(date: Date): string {
  return dateFormatter.format(date);
}

/** Uhrzeit (`HH:mm`) in der App-Zeitzone. */
export function toTimeString(date: Date): string {
  return timeFormatter.format(date);
}

/** Aktuelle Stunde (0-23) in der App-Zeitzone. */
export function currentHour(): number {
  return Number.parseInt(hourFormatter.format(new Date()), 10);
}

/**
 * Verschiebt ein `YYYY-MM-DD`-Datum um `days` Tage.
 * Rechnet bewusst auf UTC-Mitternacht, damit keine DST-Sprünge entstehen.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Anzahl Tage zwischen zwei `YYYY-MM-DD`-Datumsangaben (b - a). */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  const from = Date.parse(`${a}T00:00:00Z`);
  const to = Date.parse(`${b}T00:00:00Z`);
  return Math.round((to - from) / msPerDay);
}

/** Prüft, ob ein String ein plausibles `YYYY-MM-DD`-Datum ist. */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/**
 * Normalisiert einen unbekannten `?date=`-Query-Wert zu `YYYY-MM-DD`.
 * Fällt bei ungültiger Eingabe auf heute zurück.
 */
export function resolveDateParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return isValidDateString(raw) ? raw : today();
}

/** Begrüssung passend zur Tageszeit. */
export function greeting(): string {
  const hour = currentHour();
  if (hour < 5) return 'Gute Nacht';
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export const TIMES_OF_DAY: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morgens' },
  { id: 'noon', label: 'Mittags' },
  { id: 'evening', label: 'Abends' },
  { id: 'night', label: 'Nachts' },
];

/** Tageszeit-Slot, der aktuell am ehesten relevant ist. */
export function currentTimeOfDay(): TimeOfDay {
  const hour = currentHour();
  if (hour >= 22 || hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'noon';
  return 'evening';
}
