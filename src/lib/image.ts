/**
 * Bildvorbereitung im Browser.
 *
 * Ein iPhone-Foto liegt roh bei 3–5 MB; als Base64 im JSON-Body wächst es
 * um weitere ~33 % und überschreitet das Body-Limit der Serverless-Function.
 * Deshalb wird vor dem Upload verkleinert und neu komprimiert — das spart
 * Bandbreite und macht den Upload auf dem Handy spürbar schneller.
 */

/** Längere Kante nach der Verkleinerung. Für die Analyse mehr als ausreichend. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export interface PreparedImage {
  /** Data-URL (image/jpeg), direkt an die Upload-Route übergebbar. */
  dataUrl: string;
  width: number;
  height: number;
  /** Ungefähre Grösse der kodierten Daten in Bytes. */
  bytes: number;
}

export class ImageError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('Das Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
}

/** Liest eine Datei unverändert als Data-URL (Fallback ohne Canvas). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageError('Das Bild konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Verkleinert und komprimiert ein Bild auf eine für die Analyse
 * ausreichende Grösse.
 */
export async function prepareImage(file: File, maxEdge = MAX_EDGE): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Bitte wähle eine Bilddatei aus.');
  }

  let image: HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    // Manche Formate (z. B. HEIC in älteren Browsern) lassen sich nicht in
    // ein <img> laden — dann unverändert weiterreichen und den Server
    // entscheiden lassen.
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, width: 0, height: 0, bytes: file.size };
  }

  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, width: image.width, height: image.height, bytes: file.size };
  }

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);

  return {
    dataUrl,
    width,
    height,
    bytes: Math.round(base64Length * 0.75),
  };
}
