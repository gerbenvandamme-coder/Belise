import { supabase } from '@/lib/supabase';

export const BOOKING_BUCKET = 'booking-references';
export const SIGNED_URL_TTL_SECONDS = 3600;

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_EDGE_PX = 1200;
const LOSSY_QUALITY = 0.85;
const ACCEPTED_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_PATTERN = new RegExp(`^${UUID}$`, 'i');
const REFERENCE_PATH_PATTERN = new RegExp(`^${UUID}/${UUID}/(?:${UUID}|now|inspiration)\\.(webp|jpg)$`, 'i');

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Afbeelding kon niet worden gelezen.'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, LOSSY_QUALITY));
}

/**
 * Verkleint de afbeelding naar max. 1200px op de lange zijde en codeert die als WebP.
 * Browsers die geen WebP kunnen schrijven, vallen terug op JPEG.
 * Alles gebeurt lokaal in de browser; het bestand verlaat het apparaat pas bij de upload.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    throw new Error('Alleen JPEG, PNG of WebP zijn toegestaan.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Het bestand is groter dan 15 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    if (longestEdge === 0) {
      throw new Error('Afbeelding kon niet worden gelezen.');
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE_PX / longestEdge);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Afbeelding kon niet worden verwerkt.');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, 'image/webp');
    if (webp && webp.type === 'image/webp') {
      return webp;
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg');
    if (!jpeg) {
      throw new Error('Afbeelding kon niet worden verwerkt.');
    }
    return jpeg;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Comprimeert en uploadt een referentiefoto naar {user_id}/{booking_id}/{uuid}.webp|jpg.
 * De bestandsnaam komt niet van de gebruiker, zodat er geen pad-injectie mogelijk is.
 */
export async function uploadBookingReference(params: {
  userId: string;
  bookingId: string;
  /** Vast bestandsnaam (now.webp of inspiration.webp), zoals create_booking die verwacht. */
  kind?: 'now' | 'inspiration';
  file: File;
}): Promise<string> {
  const { userId, bookingId, file, kind } = params;
  if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(bookingId)) {
    throw new Error('Ongeldige gebruiker of boeking.');
  }

  const blob = await compressImage(file);
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = kind
    ? `${userId}/${bookingId}/${kind}.webp`
    : `${userId}/${bookingId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BOOKING_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });

  if (error) {
    throw new Error('Upload mislukt. Probeer het opnieuw.');
  }
  return path;
}

/** Geeft een tijdelijke link (1 uur) voor een foto in de privé-bucket. */
export async function getSignedReferenceUrl(path: string): Promise<string> {
  if (!REFERENCE_PATH_PATTERN.test(path)) {
    throw new Error('Ongeldig bestandspad.');
  }

  const { data, error } = await supabase.storage
    .from(BOOKING_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error('Foto kon niet worden geladen.');
  }
  return data.signedUrl;
}