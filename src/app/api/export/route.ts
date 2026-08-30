import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  dailySummaries,
  foodAnalyses,
  meals,
  medicationLogs,
  medications,
  skinAnalyses,
  skinPhotos,
  skincareLogs,
  skincareProducts,
} from '@/lib/db/schema';
import { getUserId } from '@/lib/session';
import { today } from '@/lib/date';

/**
 * Vollständiger Datenexport als JSON.
 *
 * Bilddateien selbst sind nicht enthalten — exportiert werden ihre
 * Storage-Pfade und alle strukturierten Daten. Antwort ist bewusst
 * nicht cachebar.
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [
    photos,
    analyses,
    userMeals,
    mealAnalyses,
    meds,
    medLogs,
    care,
    careLogs,
    summaries,
  ] = await Promise.all([
    db.select().from(skinPhotos).where(eq(skinPhotos.userId, userId)),
    db.select().from(skinAnalyses).where(eq(skinAnalyses.userId, userId)),
    db.select().from(meals).where(eq(meals.userId, userId)),
    db
      .select({ analysis: foodAnalyses })
      .from(foodAnalyses)
      .innerJoin(meals, eq(foodAnalyses.mealId, meals.id))
      .where(eq(meals.userId, userId)),
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(medicationLogs).where(eq(medicationLogs.userId, userId)),
    db.select().from(skincareProducts).where(eq(skincareProducts.userId, userId)),
    db.select().from(skincareLogs).where(eq(skincareLogs.userId, userId)),
    db.select().from(dailySummaries).where(eq(dailySummaries.userId, userId)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    note: 'Bilddateien sind nicht enthalten, nur ihre Speicherpfade.',
    skinPhotos: photos,
    skinAnalyses: analyses,
    meals: userMeals,
    foodAnalyses: mealAnalyses.map((row) => row.analysis),
    medications: meds,
    medicationLogs: medLogs,
    skincareProducts: care,
    skincareLogs: careLogs,
    dailySummaries: summaries,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="skin-tracker-export-${today()}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
