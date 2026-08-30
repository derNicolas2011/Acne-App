import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { skinAnalyses, skinPhotos } from '@/lib/db/schema';
import { SKIN_PHOTOS_BUCKET, downloadPhotoAsBuffer } from '@/lib/supabase/storage';
import { analyzeSkinPhoto } from '@/lib/ai/skin-analysis';
import { getLatestAnalysis } from '@/lib/queries/skin';
import { getUserId } from '@/lib/session';

/** Die Bildanalyse braucht länger als der Vercel-Standard von 10 s. */
export const maxDuration = 60;

const bodySchema = z.object({ photoId: z.string().min(1).max(64) });

/** MIME-Typ aus der Dateiendung im Storage-Pfad. */
function contentTypeFor(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Photo-ID fehlt' }, { status: 400 });
  }

  // Foto nur laden, wenn es dem angemeldeten Nutzer gehört.
  const [photo] = await db
    .select()
    .from(skinPhotos)
    .where(and(eq(skinPhotos.id, parsed.data.photoId), eq(skinPhotos.userId, userId)))
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: 'Foto nicht gefunden' }, { status: 404 });
  }

  try {
    const buffer = await downloadPhotoAsBuffer(SKIN_PHOTOS_BUCKET, photo.imageUrl);
    const imageBase64 = `data:${contentTypeFor(photo.imageUrl)};base64,${buffer.toString('base64')}`;

    const previous = await getLatestAnalysis(userId);

    const result = await analyzeSkinPhoto({
      imageBase64,
      previousScore: previous?.score ?? undefined,
      previousSummary: previous?.summary ?? undefined,
    });

    const [analysis] = await db
      .insert(skinAnalyses)
      .values({
        skinPhotoId: photo.id,
        userId,
        score: result.score,
        inflammation: result.inflammation,
        redness: result.redness,
        visibleLesions: result.visibleLesions,
        comedones: result.comedones,
        dryness: result.dryness,
        oiliness: result.oiliness,
        acneScars: result.acneScars,
        summary: result.summary,
        confidence: result.confidence,
        comparedToPrevious: result.comparedToPrevious,
      })
      .returning({ id: skinAnalyses.id });

    return NextResponse.json({ analysisId: analysis.id });
  } catch (error) {
    console.error('Analyse fehlgeschlagen:', error);
    return NextResponse.json(
      { error: 'Die Analyse konnte nicht durchgeführt werden.' },
      { status: 500 }
    );
  }
}
