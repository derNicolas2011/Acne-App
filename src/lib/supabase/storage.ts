import { supabaseAdmin } from './client';
import crypto from 'crypto';

export const SKIN_PHOTOS_BUCKET = 'skin-photos';
export const MEAL_PHOTOS_BUCKET = 'meal-photos';

export type PhotoFileInput = Buffer | Uint8Array | string;

interface NormalizedFile {
  data: Buffer | Uint8Array;
  contentType: string;
}

/**
 * Normalizes input file (Buffer, Uint8Array, or base64 string/data URL)
 * into a binary buffer and determined MIME content type.
 */
function normalizeFileInput(file: PhotoFileInput, defaultContentType: string = 'image/jpeg'): NormalizedFile {
  if (typeof file === 'string') {
    let contentType = defaultContentType;
    let base64Data = file;

    // Check for Data URL format (data:image/jpeg;base64,...)
    const dataUrlMatch = file.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1] || defaultContentType;
      base64Data = dataUrlMatch[2];
    }

    return {
      data: Buffer.from(base64Data, 'base64'),
      contentType,
    };
  }

  return {
    data: file,
    contentType: defaultContentType,
  };
}

/**
 * Derives appropriate file extension from a MIME type.
 */
function getExtensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  switch (normalized) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg';
  }
}

/**
 * Upload a skin photo to Supabase Storage.
 * @param file - The file buffer, Uint8Array, or base64 string (including data URLs)
 * @param userId - The user ID
 * @param contentType - Optional MIME type (defaults to 'image/jpeg' if not inferred from Data URL)
 * @returns The storage path (not a public URL)
 */
export async function uploadSkinPhoto(
  file: PhotoFileInput,
  userId: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const normalized = normalizeFileInput(file, contentType);
  const extension = getExtensionFromMimeType(normalized.contentType);
  const fileName = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(SKIN_PHOTOS_BUCKET)
    .upload(fileName, normalized.data, {
      contentType: normalized.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload skin photo: ${error.message}`);
  }

  if (!data?.path) {
    throw new Error('Failed to upload skin photo: No path returned from storage');
  }

  return data.path;
}

/**
 * Upload a meal photo to Supabase Storage.
 * @param file - The file buffer, Uint8Array, or base64 string (including data URLs)
 * @param userId - The user ID
 * @param contentType - Optional MIME type (defaults to 'image/jpeg' if not inferred from Data URL)
 * @returns The storage path (not a public URL)
 */
export async function uploadMealPhoto(
  file: PhotoFileInput,
  userId: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const normalized = normalizeFileInput(file, contentType);
  const extension = getExtensionFromMimeType(normalized.contentType);
  const fileName = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(MEAL_PHOTOS_BUCKET)
    .upload(fileName, normalized.data, {
      contentType: normalized.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload meal photo: ${error.message}`);
  }

  if (!data?.path) {
    throw new Error('Failed to upload meal photo: No path returned from storage');
  }

  return data.path;
}

/**
 * Get a temporary signed URL for viewing a private photo.
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 60 minutes)
 * @returns Signed URL string
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Failed to create signed URL: No URL returned from storage');
  }

  return data.signedUrl;
}

/**
 * Signiert mehrere Pfade in einem einzigen Storage-Aufruf.
 *
 * Wichtig für Listen- und Verlaufsansichten: Einzelaufrufe pro Bild
 * summieren sich sonst zu Hunderten von Requests pro Seitenaufruf.
 * Liefert eine Map von Pfad → URL; nicht signierbare Pfade fehlen darin.
 */
export async function getSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return result;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrls(unique, expiresIn);

  if (error) {
    console.error(`Signierte URLs konnten nicht erzeugt werden (${bucket}):`, error.message);
    return result;
  }

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) result.set(item.path, item.signedUrl);
  }

  return result;
}

/** Batch-Signierung für Hautfotos. */
export async function getSkinPhotoUrls(
  paths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  return getSignedUrls(SKIN_PHOTOS_BUCKET, paths, expiresIn);
}

/** Batch-Signierung für Mahlzeitenfotos. */
export async function getMealPhotoUrls(
  paths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  return getSignedUrls(MEAL_PHOTOS_BUCKET, paths, expiresIn);
}

/**
 * Get a temporary signed URL for a skin photo (default expires in 60 minutes).
 */
export async function getSkinPhotoUrl(path: string, expiresIn: number = 3600): Promise<string> {
  return getSignedUrl(SKIN_PHOTOS_BUCKET, path, expiresIn);
}

/**
 * Get a temporary signed URL for a meal photo (default expires in 60 minutes).
 */
export async function getMealPhotoUrl(path: string, expiresIn: number = 3600): Promise<string> {
  return getSignedUrl(MEAL_PHOTOS_BUCKET, path, expiresIn);
}

/**
 * Delete one or multiple photos from a storage bucket.
 * @param bucket - The storage bucket name
 * @param path - File path or array of file paths to remove
 */
export async function deletePhoto(bucket: string, path: string | string[]): Promise<void> {
  const paths = Array.isArray(path) ? path : [path];
  if (paths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to delete photo from ${bucket}: ${error.message}`);
  }
}

/**
 * Delete a skin photo from the skin-photos bucket.
 */
export async function deleteSkinPhoto(path: string | string[]): Promise<void> {
  return deletePhoto(SKIN_PHOTOS_BUCKET, path);
}

/**
 * Delete a meal photo from the meal-photos bucket.
 */
export async function deleteMealPhoto(path: string | string[]): Promise<void> {
  return deletePhoto(MEAL_PHOTOS_BUCKET, path);
}

/**
 * Download a photo file from storage as a Blob.
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 */
export async function downloadPhoto(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`Failed to download photo from ${bucket}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to download photo: No data returned for path ${path}`);
  }

  return data;
}

/**
 * Download a photo file from storage as a Node.js Buffer (useful for server-side AI analysis).
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 */
export async function downloadPhotoAsBuffer(bucket: string, path: string): Promise<Buffer> {
  const blob = await downloadPhoto(bucket, path);
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
