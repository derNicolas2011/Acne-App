'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { foodAnalyses, meals } from '@/lib/db/schema';
import { deleteMealPhoto, uploadMealPhoto } from '@/lib/supabase/storage';
import { analyzeMealImage, analyzeMealText } from '@/lib/ai/food-analysis';
import { getMealAdvice, type MealAdvice } from '@/lib/ai/meal-advice';
import { getFrequentMeals, getLastMealByType, getMealsInRange } from '@/lib/queries/nutrition';
import { countSkinEntries, getAverageScore, getScoreForDate } from '@/lib/queries/skin';
import { addDaysToDateString, today } from '@/lib/date';
import { MEAL_TYPE_IDS } from '@/lib/meal-types';
import { setMealPreset } from '@/lib/settings';
import { requireUserId } from '@/lib/session';


const addMealSchema = z.object({
  type: z.string().refine((value) => MEAL_TYPE_IDS.includes(value), 'Unbekannter Mahlzeitentyp'),
  description: z.string().max(2000).optional(),
  imageBase64: z
    .string()
    .refine((value) => /^data:image\/[a-z+]+;base64,/.test(value), 'Ungültiges Bildformat')
    .optional(),
});

export interface AddMealResult {
  mealId: string;
}

/**
 * Speichert eine Mahlzeit und gibt sofort zurück.
 *
 * Die KI-Analyse der Bestandteile läuft per `after()` nach der Antwort —
 * das Erfassen soll sich sofort erledigt anfühlen, und die Analyse ist
 * nur für die Langzeitauswertung relevant, nicht für den Moment.
 */
export async function addMeal(input: unknown): Promise<AddMealResult> {
  const userId = await requireUserId();
  const data = addMealSchema.parse(input);

  const description = data.description?.trim() || null;
  if (!description && !data.imageBase64) {
    throw new Error('Bitte beschreibe die Mahlzeit oder füge ein Foto hinzu.');
  }

  let imagePath: string | null = null;
  if (data.imageBase64) {
    imagePath = await uploadMealPhoto(data.imageBase64, userId);
  }

  const [meal] = await db
    .insert(meals)
    .values({
      userId,
      type: data.type,
      description,
      imageUrl: imagePath,
      timestamp: new Date(),
    })
    .returning({ id: meals.id });

  revalidatePath('/nutrition');
  revalidatePath('/');

  const imageForAnalysis = data.imageBase64;
  after(async () => {
    try {
      const result = imageForAnalysis
        ? await analyzeMealImage({
            imageBase64: imageForAnalysis,
            description: description ?? undefined,
          })
        : await analyzeMealText(description!);

      await db.insert(foodAnalyses).values({
        mealId: meal.id,
        ingredients: result.ingredients,
        estimatedProperties: result.estimatedProperties,
        confidence: result.confidence,
        notes: result.notes ?? null,
      });
    } catch (error) {
      // Eine fehlgeschlagene Analyse darf die gespeicherte Mahlzeit nicht
      // entwerten — der Eintrag bleibt bestehen, nur ohne Nährwertschätzung.
      console.error('Mahlzeitenanalyse fehlgeschlagen:', error);
    }
  });

  return { mealId: meal.id };
}

export async function deleteMeal(mealId: string) {
  const userId = await requireUserId();

  const [meal] = await db
    .select({ imageUrl: meals.imageUrl })
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .limit(1);

  if (!meal) throw new Error('Mahlzeit nicht gefunden');

  // Analyse zuerst — sie verweist per Fremdschlüssel auf die Mahlzeit.
  await db.delete(foodAnalyses).where(eq(foodAnalyses.mealId, mealId));
  await db.delete(meals).where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

  if (meal.imageUrl) {
    try {
      await deleteMealPhoto(meal.imageUrl);
    } catch (error) {
      console.error('Mahlzeitenfoto konnte nicht gelöscht werden:', error);
    }
  }

  revalidatePath('/nutrition');
  revalidatePath('/');
}

/** Zuletzt erfasste Mahlzeit dieses Typs — für "Wiederholen". */
export async function loadLastMeal(type: string) {
  const userId = await requireUserId();
  const meal = await getLastMealByType(userId, type);
  return meal ? { description: meal.description ?? '' } : null;
}

/** Häufige Beschreibungen eines Typs — für die Schnellauswahl. */
export async function loadFrequentMeals(type: string) {
  const userId = await requireUserId();
  const rows = await getFrequentMeals(userId, type, 4);
  return rows
    .filter((row): row is typeof row & { description: string } => Boolean(row.description))
    .map((row) => ({ description: row.description, count: row.count }));
}

/** Speichert eine Beschreibung als Vorlage, z. B. das Standard-Frühstück. */
export async function saveMealPreset(type: string, description: string) {
  const userId = await requireUserId();
  if (!MEAL_TYPE_IDS.includes(type)) throw new Error('Unbekannter Mahlzeitentyp');

  await setMealPreset(userId, type, description);
  revalidatePath('/nutrition/add');
  revalidatePath('/settings');
}

export type MealAdviceState =
  | { status: 'idle' }
  | { status: 'ok'; advice: MealAdvice }
  | { status: 'error'; message: string };

/**
 * Entscheidungshilfe vor dem Essen.
 *
 * Übergibt dem Modell den aktuellen Hautzustand nur als Kontext für die
 * Formulierung — persönliche Zusammenhänge werden daraus bewusst nicht
 * abgeleitet, dafür ist die Langzeitanalyse zuständig.
 */
export async function requestMealAdvice(
  _previous: MealAdviceState,
  formData: FormData
): Promise<MealAdviceState> {
  const userId = await requireUserId();

  const question = String(formData.get('question') ?? '').trim();
  if (question.length < 3) {
    return { status: 'error', message: 'Beschreibe kurz, worum es geht.' };
  }
  if (question.length > 500) {
    return { status: 'error', message: 'Bitte fasse dich etwas kürzer.' };
  }

  const date = today();

  try {
    const [currentScore, averageScore, analysisCount, recentMeals] = await Promise.all([
      getScoreForDate(userId, date),
      getAverageScore(userId, addDaysToDateString(date, -13), date),
      countSkinEntries(userId),
      getMealsInRange(userId, addDaysToDateString(date, -6), date),
    ]);

    const advice = await getMealAdvice(question, {
      currentScore,
      averageScore,
      analysisCount,
      recentMeals: recentMeals
        .map((meal) => meal.description)
        .filter((d): d is string => Boolean(d)),
    });

    return { status: 'ok', advice };
  } catch (error) {
    console.error('Entscheidungshilfe fehlgeschlagen:', error);
    return {
      status: 'error',
      message: 'Die Einschätzung konnte nicht erstellt werden. Bitte versuche es erneut.',
    };
  }
}
