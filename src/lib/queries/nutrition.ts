import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { foodAnalyses, meals } from '@/lib/db/schema';
import { APP_TIMEZONE } from '@/lib/date';

/**
 * Tagesgrenzen werden konsequent in der App-Zeitzone gezogen.
 * Ohne `AT TIME ZONE` würde auf einem UTC-Server (Vercel) ein Abendessen
 * um 23:00 Uhr dem Folgetag zugeordnet.
 */
const mealDate = sql`DATE(${meals.timestamp} AT TIME ZONE ${sql.raw(`'${APP_TIMEZONE}'`)})`;

export async function getMealsByDate(userId: string, date: string) {
  return db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), sql`${mealDate} = ${date}::date`))
    .orderBy(desc(meals.timestamp));
}

export async function getMealsInRange(userId: string, startDate: string, endDate: string) {
  return db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        sql`${mealDate} >= ${startDate}::date`,
        sql`${mealDate} <= ${endDate}::date`
      )
    )
    .orderBy(desc(meals.timestamp));
}

/** Mahlzeiten eines Zeitraums samt gespeicherter KI-Analyse. */
export async function getMealsWithAnalysisInRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  return db
    .select({
      id: meals.id,
      type: meals.type,
      description: meals.description,
      timestamp: meals.timestamp,
      date: sql<string>`${mealDate}::text`,
      ingredients: foodAnalyses.ingredients,
      properties: foodAnalyses.estimatedProperties,
    })
    .from(meals)
    .leftJoin(foodAnalyses, eq(foodAnalyses.mealId, meals.id))
    .where(
      and(
        eq(meals.userId, userId),
        sql`${mealDate} >= ${startDate}::date`,
        sql`${mealDate} <= ${endDate}::date`
      )
    )
    .orderBy(desc(meals.timestamp));
}

export async function getMealCountByDate(userId: string, date: string) {
  const rows = await db
    .select({ id: meals.id, type: meals.type })
    .from(meals)
    .where(and(eq(meals.userId, userId), sql`${mealDate} = ${date}::date`));

  return { count: rows.length, types: rows.map((m) => m.type) };
}

/** Zuletzt erfasste Mahlzeit eines Typs — Grundlage für "Wiederholen". */
export async function getLastMealByType(userId: string, type: string) {
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.type, type)))
    .orderBy(desc(meals.timestamp))
    .limit(1);
  return row ?? null;
}

/**
 * Die häufigsten Beschreibungen eines Mahlzeitentyps.
 * Speist die Schnellauswahl beim Erfassen (z. B. Standard-Frühstück).
 */
export async function getFrequentMeals(userId: string, type: string, limit = 5) {
  return db
    .select({
      description: meals.description,
      count: sql<number>`COUNT(*)::int`,
      lastUsed: sql<Date>`MAX(${meals.timestamp})`,
    })
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        eq(meals.type, type),
        sql`${meals.description} IS NOT NULL AND LENGTH(TRIM(${meals.description})) > 0`
      )
    )
    .groupBy(meals.description)
    .orderBy(sql`COUNT(*) DESC`, sql`MAX(${meals.timestamp}) DESC`)
    .limit(limit);
}

export async function getMealById(userId: string, mealId: string) {
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .limit(1);
  return row ?? null;
}
