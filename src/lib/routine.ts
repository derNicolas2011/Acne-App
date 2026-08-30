import { daysBetween, type TimeOfDay } from '@/lib/date';

/**
 * Log-Status einer Routine-Aufgabe.
 * Geschrieben wird ausschliesslich einer dieser Werte.
 */
export type RoutineStatus = 'done' | 'missed' | 'skipped';

/**
 * Als "erledigt" zählende Status-Werte.
 * `taken` wird beim Lesen toleriert (früher von Medikamenten-Logs benutzt).
 */
const COMPLETED_STATUSES = new Set(['done', 'taken']);

export function isCompleted(status: string | null | undefined): boolean {
  return status != null && COMPLETED_STATUSES.has(status);
}

/** Gemeinsame Felder von Medikamenten und Skincare-Produkten. */
export interface RoutineItem {
  id: string;
  name: string;
  timesOfDay: unknown;
  frequency: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean | null;
}

/** Liest das `timesOfDay`-JSONB-Feld defensiv als Liste von Tageszeiten. */
export function timesOfDay(item: { timesOfDay: unknown }): TimeOfDay[] {
  if (!Array.isArray(item.timesOfDay)) return [];
  const valid: TimeOfDay[] = ['morning', 'noon', 'evening', 'night'];
  return item.timesOfDay.filter((t): t is TimeOfDay =>
    typeof t === 'string' && (valid as string[]).includes(t)
  );
}

/**
 * Ist die Aufgabe an diesem Datum überhaupt eingeplant?
 *
 * Berücksichtigt Aktiv-Status, Start-/Enddatum und die konfigurierte
 * Häufigkeit. "Bei Bedarf" gilt nie als eingeplant und fliesst deshalb
 * nicht in die Compliance ein.
 */
export function isScheduledOn(item: RoutineItem, date: string): boolean {
  if (item.isActive === false) return false;
  if (item.startDate > date) return false;
  if (item.endDate && item.endDate < date) return false;

  const elapsed = daysBetween(item.startDate, date);
  if (elapsed < 0) return false;

  switch (item.frequency) {
    case 'Jeden 2. Tag':
      return elapsed % 2 === 0;
    case 'Wöchentlich':
      return elapsed % 7 === 0;
    case '2x wöchentlich':
      return elapsed % 7 === 0 || elapsed % 7 === 3;
    case 'Bei Bedarf':
      return false;
    default:
      // "Täglich" und alles ohne explizite Angabe.
      return true;
  }
}

/** Ein einzelner erwarteter Routine-Slot an einem Tag. */
export interface RoutineSlot {
  itemId: string;
  timeOfDay: TimeOfDay;
}

/** Alle an einem Tag erwarteten Slots für eine Liste von Aufgaben. */
export function scheduledSlots(items: RoutineItem[], date: string): RoutineSlot[] {
  const slots: RoutineSlot[] = [];
  for (const item of items) {
    if (!isScheduledOn(item, date)) continue;
    for (const timeOfDay of timesOfDay(item)) {
      slots.push({ itemId: item.id, timeOfDay });
    }
  }
  return slots;
}

export interface CompletionCount {
  total: number;
  completed: number;
}

/**
 * Zählt erledigte gegen erwartete Slots.
 * Nur Logs zu tatsächlich eingeplanten Slots werden gewertet, damit
 * nachträglich deaktivierte Produkte die Quote nicht verfälschen.
 */
export function countCompletion(
  slots: RoutineSlot[],
  logs: { itemId: string; timeOfDay: string; status: string }[]
): CompletionCount {
  const doneKeys = new Set(
    logs.filter((l) => isCompleted(l.status)).map((l) => `${l.itemId}-${l.timeOfDay}`)
  );
  const completed = slots.filter((s) => doneKeys.has(`${s.itemId}-${s.timeOfDay}`)).length;
  return { total: slots.length, completed };
}
