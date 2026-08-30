import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { medicationLogs, medications, skincareLogs, skincareProducts } from '@/lib/db/schema';
import { addDaysToDateString } from '@/lib/date';
import {
  countCompletion,
  isCompleted,
  scheduledSlots,
  type RoutineItem,
} from '@/lib/routine';

/** Alle Medikamente des Nutzers (inkl. inaktiver, für die Verwaltungsansicht). */
export async function getMedications(userId: string) {
  return db
    .select()
    .from(medications)
    .where(eq(medications.userId, userId))
    .orderBy(desc(medications.isActive), desc(medications.createdAt));
}

/** Nur aktuell aktive Medikamente. */
export async function getActiveMedications(userId: string) {
  return db
    .select()
    .from(medications)
    .where(and(eq(medications.userId, userId), eq(medications.isActive, true)))
    .orderBy(desc(medications.createdAt));
}

/** Alle Skincare-Produkte des Nutzers (inkl. inaktiver). */
export async function getSkincareProducts(userId: string) {
  return db
    .select()
    .from(skincareProducts)
    .where(eq(skincareProducts.userId, userId))
    .orderBy(desc(skincareProducts.isActive), desc(skincareProducts.createdAt));
}

/** Nur aktuell aktive Skincare-Produkte. */
export async function getActiveSkincareProducts(userId: string) {
  return db
    .select()
    .from(skincareProducts)
    .where(and(eq(skincareProducts.userId, userId), eq(skincareProducts.isActive, true)))
    .orderBy(desc(skincareProducts.createdAt));
}

export async function getMedicationLogs(userId: string, date: string) {
  return db
    .select()
    .from(medicationLogs)
    .where(and(eq(medicationLogs.userId, userId), eq(medicationLogs.date, date)));
}

export async function getSkincareLogs(userId: string, date: string) {
  return db
    .select()
    .from(skincareLogs)
    .where(and(eq(skincareLogs.userId, userId), eq(skincareLogs.date, date)));
}

/**
 * Medikamente + Skincare, die an einem Datum eingeplant sein *können*
 * (aktiv und im Gültigkeitszeitraum). Die konkrete Häufigkeitsprüfung
 * passiert danach in `isScheduledOn`.
 */
async function itemsValidOn(userId: string, date: string) {
  const dateRange = (
    table: typeof medications | typeof skincareProducts
  ) =>
    and(
      eq(table.userId, userId),
      eq(table.isActive, true),
      lte(table.startDate, date),
      or(isNull(table.endDate), gte(table.endDate, date))
    );

  const [meds, care] = await Promise.all([
    db.select().from(medications).where(dateRange(medications)),
    db.select().from(skincareProducts).where(dateRange(skincareProducts)),
  ]);

  return { meds, care };
}

export interface DayRoutineStatus {
  medications: { total: number; completed: number };
  skincare: { total: number; completed: number };
}

/** Erwartete vs. erledigte Routine-Slots an einem Tag. */
export async function getRoutineStatus(userId: string, date: string): Promise<DayRoutineStatus> {
  const [{ meds, care }, medLogs, careLogs] = await Promise.all([
    itemsValidOn(userId, date),
    getMedicationLogs(userId, date),
    getSkincareLogs(userId, date),
  ]);

  return {
    medications: countCompletion(
      scheduledSlots(meds as RoutineItem[], date),
      medLogs.map((l) => ({
        itemId: l.medicationId ?? '',
        timeOfDay: l.timeOfDay,
        status: l.status,
      }))
    ),
    skincare: countCompletion(
      scheduledSlots(care as RoutineItem[], date),
      careLogs.map((l) => ({
        itemId: l.productId ?? '',
        timeOfDay: l.timeOfDay,
        status: l.status,
      }))
    ),
  };
}

export interface ComplianceSummary {
  /** Tage, an denen *alle* eingeplanten Slots erledigt wurden. */
  fullDays: number;
  /** Tage im Zeitraum, an denen überhaupt etwas eingeplant war. */
  scheduledDays: number;
  /** Anteil erledigter Slots über den gesamten Zeitraum (0–1). */
  slotRate: number;
  /** Erledigte Tage in Folge bis heute (bzw. bis zum Endedatum). */
  streak: number;
}

/**
 * Compliance über einen Zeitraum von `days` Tagen bis einschliesslich `endDate`.
 *
 * Rechnet slot-genau: pro Tag wird aus den aktiven Einträgen und ihrer
 * Häufigkeit ermittelt, was erwartet war, und mit den Logs verglichen.
 */
export async function getCompliance(
  userId: string,
  endDate: string,
  days: number
): Promise<ComplianceSummary> {
  const startDate = addDaysToDateString(endDate, -(days - 1));

  const [meds, care, medLogs, careLogs] = await Promise.all([
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(skincareProducts).where(eq(skincareProducts.userId, userId)),
    db
      .select()
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.date, startDate),
          lte(medicationLogs.date, endDate)
        )
      ),
    db
      .select()
      .from(skincareLogs)
      .where(
        and(
          eq(skincareLogs.userId, userId),
          gte(skincareLogs.date, startDate),
          lte(skincareLogs.date, endDate)
        )
      ),
  ]);

  const doneByDate = new Map<string, Set<string>>();
  const addLog = (date: string, itemId: string | null, timeOfDay: string, status: string) => {
    if (!itemId || !isCompleted(status)) return;
    if (!doneByDate.has(date)) doneByDate.set(date, new Set());
    doneByDate.get(date)!.add(`${itemId}-${timeOfDay}`);
  };
  for (const l of medLogs) addLog(l.date, l.medicationId, l.timeOfDay, l.status);
  for (const l of careLogs) addLog(l.date, l.productId, l.timeOfDay, l.status);

  const allItems = [...meds, ...care] as RoutineItem[];

  let fullDays = 0;
  let scheduledDays = 0;
  let totalSlots = 0;
  let doneSlots = 0;
  let streak = 0;
  let streakBroken = false;

  // Rückwärts vom Enddatum, damit der Streak direkt mitgezählt werden kann.
  for (let offset = 0; offset < days; offset++) {
    const date = addDaysToDateString(endDate, -offset);
    const slots = scheduledSlots(allItems, date);
    if (slots.length === 0) {
      if (!streakBroken) continue; // Tage ohne Plan brechen den Streak nicht.
      continue;
    }

    scheduledDays++;
    totalSlots += slots.length;
    const done = doneByDate.get(date) ?? new Set<string>();
    const completed = slots.filter((s) => done.has(`${s.itemId}-${s.timeOfDay}`)).length;
    doneSlots += completed;

    const isFull = completed === slots.length;
    if (isFull) fullDays++;
    if (!streakBroken) {
      if (isFull) streak++;
      else streakBroken = true;
    }
  }

  return {
    fullDays,
    scheduledDays,
    slotRate: totalSlots > 0 ? doneSlots / totalSlots : 0,
    streak,
  };
}

/**
 * Erledigte Slots pro Tag über einen Zeitraum — Grundlage für die
 * Korrelation von Routine und Hautbild.
 */
export async function getDailyComplianceSeries(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; rate: number }[]> {
  const [meds, care, medLogs, careLogs] = await Promise.all([
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(skincareProducts).where(eq(skincareProducts.userId, userId)),
    db
      .select()
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.date, startDate),
          lte(medicationLogs.date, endDate)
        )
      ),
    db
      .select()
      .from(skincareLogs)
      .where(
        and(
          eq(skincareLogs.userId, userId),
          gte(skincareLogs.date, startDate),
          lte(skincareLogs.date, endDate)
        )
      ),
  ]);

  const doneByDate = new Map<string, Set<string>>();
  const addLog = (date: string, itemId: string | null, timeOfDay: string, status: string) => {
    if (!itemId || !isCompleted(status)) return;
    if (!doneByDate.has(date)) doneByDate.set(date, new Set());
    doneByDate.get(date)!.add(`${itemId}-${timeOfDay}`);
  };
  for (const l of medLogs) addLog(l.date, l.medicationId, l.timeOfDay, l.status);
  for (const l of careLogs) addLog(l.date, l.productId, l.timeOfDay, l.status);

  const allItems = [...meds, ...care] as RoutineItem[];
  const series: { date: string; rate: number }[] = [];

  let date = startDate;
  while (date <= endDate) {
    const slots = scheduledSlots(allItems, date);
    if (slots.length > 0) {
      const done = doneByDate.get(date) ?? new Set<string>();
      const completed = slots.filter((s) => done.has(`${s.itemId}-${s.timeOfDay}`)).length;
      series.push({ date, rate: completed / slots.length });
    }
    date = addDaysToDateString(date, 1);
  }

  return series;
}

/** Prüft, ob ein Eintrag dem Nutzer gehört (vor Löschen/Ändern). */
export async function ownsMedication(userId: string, id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: medications.id })
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function ownsSkincareProduct(userId: string, id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: skincareProducts.id })
    .from(skincareProducts)
    .where(and(eq(skincareProducts.id, id), eq(skincareProducts.userId, userId)))
    .limit(1);
  return Boolean(row);
}
