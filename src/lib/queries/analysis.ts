import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dailySummaries } from '@/lib/db/schema';

export async function getDailySummary(userId: string, date: string) {
  const [row] = await db
    .select()
    .from(dailySummaries)
    .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)))
    .limit(1);
  return row ?? null;
}

/** Zusammenfassungen eines Zeitraums, neueste zuerst. */
export async function getSummariesInRange(userId: string, startDate: string, endDate: string) {
  return db
    .select()
    .from(dailySummaries)
    .where(
      and(
        eq(dailySummaries.userId, userId),
        gte(dailySummaries.date, startDate),
        lte(dailySummaries.date, endDate)
      )
    )
    .orderBy(desc(dailySummaries.date));
}
