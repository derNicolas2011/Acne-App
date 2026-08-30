import { and, asc, desc, eq, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { skinAnalyses, skinPhotos } from '@/lib/db/schema';
import {
  getSkinPhotoUrl as signSkinPhoto,
  getSkinPhotoUrls as signSkinPhotos,
} from '@/lib/supabase/storage';
import { APP_TIMEZONE } from '@/lib/date';

const photoDate = sql`DATE(${skinPhotos.takenAt} AT TIME ZONE ${sql.raw(`'${APP_TIMEZONE}'`)})`;

export interface SkinEntry {
  analysisId: string;
  photoId: string;
  frontImagePath: string;
  leftImagePath: string;
  rightImagePath: string;
  date: string;
  takenAt: Date;
  score: number | null;
  inflammation: number | null;
  redness: number | null;
  visibleLesions: number | null;
  comedones: number | null;
}

const entryColumns = {
  analysisId: skinAnalyses.id,
  photoId: skinPhotos.id,
  frontImagePath: skinPhotos.frontImageUrl,
  leftImagePath: skinPhotos.leftImageUrl,
  rightImagePath: skinPhotos.rightImageUrl,
  date: sql<string>`${photoDate}::text`,
  takenAt: skinPhotos.takenAt,
  score: skinAnalyses.score,
  inflammation: skinAnalyses.inflammation,
  redness: skinAnalyses.redness,
  visibleLesions: skinAnalyses.visibleLesions,
  comedones: skinAnalyses.comedones,
};

/**
 * Verlaufsdaten ohne Bilder — bewusst getrennt vom Signieren der URLs,
 * weil jede signierte URL einen eigenen Storage-Aufruf kostet. Charts
 * brauchen die Bilder nicht.
 */
export async function getSkinSeries(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SkinEntry[]> {
  return db
    .select(entryColumns)
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(
      and(
        eq(skinAnalyses.userId, userId),
        sql`${photoDate} >= ${startDate}::date`,
        sql`${photoDate} <= ${endDate}::date`
      )
    )
    .orderBy(asc(skinPhotos.takenAt));
}

/** Die neuesten Einträge, absteigend — für Listen mit Vorschaubildern. */
export async function getRecentSkinEntries(userId: string, limit: number): Promise<SkinEntry[]> {
  return db
    .select(entryColumns)
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(eq(skinAnalyses.userId, userId))
    .orderBy(desc(skinPhotos.takenAt))
    .limit(limit);
}

export async function countSkinEntries(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(skinAnalyses)
    .where(eq(skinAnalyses.userId, userId));
  return row?.count ?? 0;
}

/**
 * Signiert alle Bildpfade in *einem* Storage-Aufruf und hängt die URLs an.
 * Einzelsignierung pro Eintrag hatte bei langen Verläufen hunderte
 * Requests pro Seitenaufruf erzeugt.
 */
export async function withSignedUrls<
  T extends { frontImagePath: string; leftImagePath: string; rightImagePath: string }
>(
  entries: T[]
): Promise<
  (T & { frontPhotoUrl: string | null; leftPhotoUrl: string | null; rightPhotoUrl: string | null })[]
> {
  const allPaths = entries.flatMap((e) => [e.frontImagePath, e.leftImagePath, e.rightImagePath]);
  const urls = await signSkinPhotos(allPaths);
  return entries.map((entry) => ({
    ...entry,
    frontPhotoUrl: urls.get(entry.frontImagePath) ?? null,
    leftPhotoUrl: urls.get(entry.leftImagePath) ?? null,
    rightPhotoUrl: urls.get(entry.rightImagePath) ?? null,
  }));
}

/** Neueste Analyse eines Tages (falls mehrere Fotos erfasst wurden). */
export async function getAnalysisForDate(userId: string, date: string) {
  const [row] = await db
    .select({
      ...entryColumns,
      summary: skinAnalyses.summary,
      comparedToPrevious: skinAnalyses.comparedToPrevious,
      confidence: skinAnalyses.confidence,
      dryness: skinAnalyses.dryness,
      oiliness: skinAnalyses.oiliness,
      acneScars: skinAnalyses.acneScars,
    })
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(and(eq(skinAnalyses.userId, userId), sql`${photoDate} = ${date}::date`))
    .orderBy(desc(skinPhotos.takenAt))
    .limit(1);
  return row ?? null;
}

export async function getLatestAnalysis(userId: string) {
  const [row] = await db
    .select()
    .from(skinAnalyses)
    .where(eq(skinAnalyses.userId, userId))
    .orderBy(desc(skinAnalyses.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * Vollständige Analyse inkl. signierter Bild-URL.
 * Immer auf den Nutzer eingeschränkt — sonst wären fremde Gesichtsfotos
 * allein über die Analyse-ID abrufbar.
 */
export async function getAnalysisById(userId: string, analysisId: string) {
  const [row] = await db
    .select({ analysis: skinAnalyses, photo: skinPhotos })
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId)))
    .limit(1);

  if (!row) return null;

  let frontPhotoUrl: string | null = null;
  let leftPhotoUrl: string | null = null;
  let rightPhotoUrl: string | null = null;
  try {
    const urls = await signSkinPhotos([
      row.photo.frontImageUrl,
      row.photo.leftImageUrl,
      row.photo.rightImageUrl,
    ]);
    frontPhotoUrl = urls.get(row.photo.frontImageUrl) ?? null;
    leftPhotoUrl = urls.get(row.photo.leftImageUrl) ?? null;
    rightPhotoUrl = urls.get(row.photo.rightImageUrl) ?? null;
  } catch (error) {
    console.error('Signierte URLs konnten nicht erzeugt werden:', error);
  }

  return {
    ...row.analysis,
    takenAt: row.photo.takenAt,
    frontPhotoUrl,
    leftPhotoUrl,
    rightPhotoUrl,
  };
}

/** Die Analyse unmittelbar vor einer gegebenen — für den Vergleich. */
export async function getPreviousAnalysis(userId: string, before: Date) {
  const [row] = await db
    .select(entryColumns)
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(and(eq(skinAnalyses.userId, userId), lte(skinPhotos.takenAt, before)))
    .orderBy(desc(skinPhotos.takenAt))
    .limit(1);
  return row ?? null;
}

export async function getScoreForDate(userId: string, date: string): Promise<number | null> {
  const [row] = await db
    .select({ score: skinAnalyses.score })
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(and(eq(skinAnalyses.userId, userId), sql`${photoDate} = ${date}::date`))
    .orderBy(desc(skinPhotos.takenAt))
    .limit(1);
  return row?.score ?? null;
}

/** Durchschnittlicher Score über einen Zeitraum (inklusive Grenzen). */
export async function getAverageScore(
  userId: string,
  startDate: string,
  endDate: string
): Promise<number | null> {
  const [row] = await db
    .select({ average: sql<string | null>`AVG(${skinAnalyses.score})` })
    .from(skinAnalyses)
    .innerJoin(skinPhotos, eq(skinAnalyses.skinPhotoId, skinPhotos.id))
    .where(
      and(
        eq(skinAnalyses.userId, userId),
        sql`${photoDate} >= ${startDate}::date`,
        sql`${photoDate} <= ${endDate}::date`
      )
    );
  return row?.average != null ? Math.round(Number(row.average)) : null;
}

export async function hasPhotoOnDate(userId: string, date: string): Promise<boolean> {
  const [row] = await db
    .select({ id: skinPhotos.id })
    .from(skinPhotos)
    .where(and(eq(skinPhotos.userId, userId), sql`${photoDate} = ${date}::date`))
    .limit(1);
  return Boolean(row);
}

/** Foto samt Analyse löschen (Datenschutz: Nutzer muss Bilder entfernen können). */
export async function getPhotoForDeletion(userId: string, photoId: string) {
  const [row] = await db
    .select()
    .from(skinPhotos)
    .where(and(eq(skinPhotos.id, photoId), eq(skinPhotos.userId, userId)))
    .limit(1);
  return row ?? null;
}
