import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { skinPhotos } from '@/lib/db/schema';
import { uploadSkinPhoto } from '@/lib/supabase/storage';
import { getUserId } from '@/lib/session';

/** Obergrenze für ein einzelnes Bild (nach der Verkleinerung im Browser). */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z
    .string()
    .min(1)
    .refine((value) => /^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/.test(value), {
      message: 'Es wird ein Bild im Data-URL-Format erwartet.',
    }),
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
      { error: 'Es wurde kein gültiges Bild übermittelt.' },
      { status: 400 }
    );
  }

  const { imageBase64 } = parsed.data;
  const base64Length = imageBase64.length - (imageBase64.indexOf(',') + 1);
  if (base64Length * 0.75 > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'Das Bild ist zu gross. Bitte nimm ein neues Foto auf.' },
      { status: 413 }
    );
  }

  try {
    const path = await uploadSkinPhoto(imageBase64, userId);

    const [photo] = await db
      .insert(skinPhotos)
      .values({ userId, imageUrl: path, takenAt: new Date() })
      .returning({ id: skinPhotos.id });

    return NextResponse.json({ photoId: photo.id });
  } catch (error) {
    console.error('Upload fehlgeschlagen:', error);
    return NextResponse.json(
      { error: 'Das Foto konnte nicht gespeichert werden.' },
      { status: 500 }
    );
  }
}
