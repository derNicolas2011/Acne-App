import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { skinPhotos } from '@/lib/db/schema';
import { uploadSkinPhoto } from '@/lib/supabase/storage';
import { getUserId } from '@/lib/session';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const base64Schema = z
  .string()
  .min(1)
  .refine((value) => /^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/.test(value), {
    message: 'Es wird ein Bild im Data-URL-Format erwartet.',
  });

const bodySchema = z.object({
  frontBase64: base64Schema,
  leftBase64: base64Schema,
  rightBase64: base64Schema,
});

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
    return NextResponse.json(
      { error: 'Es wurden keine gültigen Bilder übermittelt.' },
      { status: 400 }
    );
  }

  const { frontBase64, leftBase64, rightBase64 } = parsed.data;

  for (const b64 of [frontBase64, leftBase64, rightBase64]) {
    const base64Length = b64.length - (b64.indexOf(',') + 1);
    if (base64Length * 0.75 > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Eines der Bilder ist zu gross. Bitte nimm neue Fotos auf.' },
        { status: 413 }
      );
    }
  }

  try {
    const [frontPath, leftPath, rightPath] = await Promise.all([
      uploadSkinPhoto(frontBase64, userId),
      uploadSkinPhoto(leftBase64, userId),
      uploadSkinPhoto(rightBase64, userId),
    ]);

    const [photo] = await db
      .insert(skinPhotos)
      .values({ 
        userId, 
        frontImageUrl: frontPath,
        leftImageUrl: leftPath,
        rightImageUrl: rightPath,
        takenAt: new Date() 
      })
      .returning({ id: skinPhotos.id });

    return NextResponse.json({ photoId: photo.id });
  } catch (error) {
    console.error('Upload fehlgeschlagen:', error);
    return NextResponse.json(
      { error: 'Die Fotos konnten nicht gespeichert werden.' },
      { status: 500 }
    );
  }
}
