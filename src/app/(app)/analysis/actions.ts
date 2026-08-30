'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { dailySummaries } from '@/lib/db/schema';
import { generateDailySummary } from '@/lib/ai/daily-summary';
import { getAverageScore, getAnalysisForDate } from '@/lib/queries/skin';
import { getRoutineStatus } from '@/lib/queries/treatment';
import { getMealsByDate } from '@/lib/queries/nutrition';
import { addDaysToDateString, isValidDateString } from '@/lib/date';
import { requireUserId } from '@/lib/session';


export type ReportState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done' };

/**
 * Erzeugt die Tageszusammenfassung.
 *
 * Nutzt durchgängig die Session-User-ID — vorher war hier eine feste
 * ID hinterlegt, die zu keinem Datensatz der App passte, sodass die
 * Berichte weder korrekte Daten enthielten noch angezeigt wurden.
 */
export async function generateDailyReport(
  _previous: ReportState,
  formData: FormData
): Promise<ReportState> {
  const userId = await requireUserId();

  const date = String(formData.get('date') ?? '');
  if (!isValidDateString(date)) {
    return { status: 'error', message: 'Ungültiges Datum.' };
  }

  try {
    const [analysis, average14, routine, dayMeals, previousSummary] = await Promise.all([
      getAnalysisForDate(userId, date),
      getAverageScore(userId, addDaysToDateString(date, -13), date),
      getRoutineStatus(userId, date),
      getMealsByDate(userId, date),
      db
        .select({ aiSummary: dailySummaries.aiSummary })
        .from(dailySummaries)
        .where(
          and(
            eq(dailySummaries.userId, userId),
            eq(dailySummaries.date, addDaysToDateString(date, -1))
          )
        )
        .limit(1),
    ]);

    const hasData =
      analysis !== null ||
      dayMeals.length > 0 ||
      routine.medications.total > 0 ||
      routine.skincare.total > 0;

    if (!hasData) {
      return {
        status: 'error',
        message: 'Für diesen Tag liegen noch keine Einträge vor.',
      };
    }

    const aiSummary = await generateDailySummary({
      date,
      skinAnalysis: analysis
        ? {
            score: analysis.score ?? 0,
            summary: analysis.summary ?? '',
            comparedToPrevious: analysis.comparedToPrevious ?? 'unknown',
          }
        : null,
      averageScore14Days: average14,
      medicationCompliance: routine.medications,
      skincareCompliance: routine.skincare,
      meals: dayMeals.map((meal) => ({ type: meal.type, description: meal.description })),
      previousDaySummary: previousSummary[0]?.aiSummary ?? null,
    });

    const totalSlots = routine.medications.total + routine.skincare.total;
    const doneSlots = routine.medications.completed + routine.skincare.completed;

    await db
      .insert(dailySummaries)
      .values({
        userId,
        date,
        skinScore: analysis?.score ?? null,
        // Ohne geplante Routine gibt es keine sinnvolle Quote.
        treatmentCompliance: totalSlots > 0 ? doneSlots / totalSlots : null,
        mealCount: dayMeals.length,
        aiSummary,
      })
      .onConflictDoUpdate({
        target: [dailySummaries.userId, dailySummaries.date],
        set: {
          skinScore: analysis?.score ?? null,
          treatmentCompliance: totalSlots > 0 ? doneSlots / totalSlots : null,
          mealCount: dayMeals.length,
          aiSummary,
        },
      });

    revalidatePath('/timeline');
    revalidatePath('/analysis');
    return { status: 'done' };
  } catch (error) {
    console.error('Tagesbericht fehlgeschlagen:', error);
    return {
      status: 'error',
      message: 'Der Bericht konnte nicht erstellt werden. Bitte versuche es erneut.',
    };
  }
}
