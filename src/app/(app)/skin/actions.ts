'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { skinAnalyses, skinPhotos } from '@/lib/db/schema';
import { deleteSkinPhoto } from '@/lib/supabase/storage';
import { requireUserId } from '@/lib/session';

/**
 * Löscht ein Hautfoto samt Analyse — Bilddatei zuerst aus dem Storage,
 * dann die Datensätze. Datenschutz: Der Nutzer muss seine Gesichtsfotos
 * jederzeit vollständig entfernen können.
 */
export async function deleteSkinEntry(analysisId: string) {
  const userId = await requireUserId();

  const [entry] = await db
    .select({
      photoId: skinPhotos.id,
      front: skinPhotos.frontImageUrl,
      left: skinPhotos.leftImageUrl,
      right: skinPhotos.rightImageUrl
    })
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId)))
    .limit(1);

  if (!entry) throw new Error('Eintrag nicht gefunden');

  try {
    await deleteSkinPhoto([entry.front, entry.left, entry.right]);
  } catch (error) {
    // Die Datenbankeinträge werden trotzdem entfernt; eine verwaiste Datei
    // ist besser als ein Datensatz, der auf ein "gelöschtes" Bild zeigt.
    console.error('Bilddatei konnte nicht gelöscht werden:', error);
  }

  await db
    .delete(skinAnalyses)
    .where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId)));
  await db
    .delete(skinPhotos)
    .where(and(eq(skinPhotos.id, entry.photoId), eq(skinPhotos.userId, userId)));

  revalidatePath('/skin');
  revalidatePath('/');
}
