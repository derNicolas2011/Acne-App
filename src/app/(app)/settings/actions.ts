'use server';

import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
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
import { deleteMealPhoto, deleteSkinPhoto } from '@/lib/supabase/storage';
import { setMealPreset } from '@/lib/settings';
import { requireUserId } from '@/lib/session';

export type DeleteState = { status: 'idle' } | { status: 'error'; message: string };

/**
 * Löscht sämtliche Daten des Nutzers — Bilder zuerst, dann die Datensätze
 * in Reihenfolge der Fremdschlüssel. Das Konto selbst bleibt bestehen,
 * damit die Anmeldung weiter funktioniert.
 */
export async function deleteAllData(
  _previous: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const userId = await requireUserId();

  if (String(formData.get('confirm') ?? '').trim().toUpperCase() !== 'LÖSCHEN') {
    return { status: 'error', message: 'Bitte tippe LÖSCHEN, um zu bestätigen.' };
  }

  try {
    const [photos, userMeals] = await Promise.all([
      db
        .select({ id: skinPhotos.id, path: skinPhotos.imageUrl })
        .from(skinPhotos)
        .where(eq(skinPhotos.userId, userId)),
      db
        .select({ id: meals.id, path: meals.imageUrl })
        .from(meals)
        .where(eq(meals.userId, userId)),
    ]);

    const skinPaths = photos.map((p) => p.path).filter(Boolean);
    const mealPaths = userMeals.map((m) => m.path).filter((p): p is string => Boolean(p));

    if (skinPaths.length > 0) {
      try {
        await deleteSkinPhoto(skinPaths);
      } catch (error) {
        console.error('Hautfotos konnten nicht gelöscht werden:', error);
      }
    }
    if (mealPaths.length > 0) {
      try {
        await deleteMealPhoto(mealPaths);
      } catch (error) {
        console.error('Mahlzeitenfotos konnten nicht gelöscht werden:', error);
      }
    }

    const mealIds = userMeals.map((m) => m.id);
    if (mealIds.length > 0) {
      await db.delete(foodAnalyses).where(inArray(foodAnalyses.mealId, mealIds));
    }

    await db.delete(skinAnalyses).where(eq(skinAnalyses.userId, userId));
    await db.delete(skinPhotos).where(eq(skinPhotos.userId, userId));
    await db.delete(meals).where(eq(meals.userId, userId));
    await db.delete(medicationLogs).where(eq(medicationLogs.userId, userId));
    await db.delete(medications).where(eq(medications.userId, userId));
    await db.delete(skincareLogs).where(eq(skincareLogs.userId, userId));
    await db.delete(skincareProducts).where(eq(skincareProducts.userId, userId));
    await db.delete(dailySummaries).where(eq(dailySummaries.userId, userId));

    revalidatePath('/', 'layout');
    return { status: 'idle' };
  } catch (error) {
    console.error('Löschen aller Daten fehlgeschlagen:', error);
    return { status: 'error', message: 'Die Daten konnten nicht gelöscht werden.' };
  }
}

/** Entfernt eine gespeicherte Mahlzeiten-Vorlage. */
export async function removeMealPreset(type: string) {
  const userId = await requireUserId();
  await setMealPreset(userId, type, '');
  revalidatePath('/settings');
}
