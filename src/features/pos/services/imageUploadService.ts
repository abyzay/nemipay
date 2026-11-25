import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { supabase } from '@/services/supabase';

export const PRODUCT_IMAGES_BUCKET = 'product-images';
const MAX_IMAGE_DIMENSION = 800;
const WEBP_COMPRESS_QUALITY = 0.75;
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export interface PosImageUploadDraft {
  imageUri?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const outputLength = Math.floor((clean.length * 3) / 4) - padding;
  const bytes = new Uint8Array(Math.max(0, outputLength));
  let byteIndex = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const c1 = BASE64_ALPHABET.indexOf(clean[i] ?? 'A');
    const c2 = BASE64_ALPHABET.indexOf(clean[i + 1] ?? 'A');
    const c3 = clean[i + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(clean[i + 2] ?? 'A');
    const c4 = clean[i + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(clean[i + 3] ?? 'A');
    const triplet = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;

    if (byteIndex < bytes.length) bytes[byteIndex++] = (triplet >> 16) & 0xff;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (triplet >> 8) & 0xff;
    if (byteIndex < bytes.length) bytes[byteIndex++] = triplet & 0xff;
  }

  return bytes;
}

function inferFallbackMeta(
  uri: string,
  mimeType?: string | null
): { contentType: string; extension: string } {
  const normalizedMime = mimeType?.toLowerCase() ?? '';
  const lowerUri = uri.toLowerCase();
  if (normalizedMime.includes('webp') || lowerUri.endsWith('.webp')) {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  if (normalizedMime.includes('png') || lowerUri.endsWith('.png')) {
    return { contentType: 'image/png', extension: 'png' };
  }
  return { contentType: 'image/jpeg', extension: 'jpg' };
}

/**
 * Redimensiona y comprime una imagen local a formato WebP antes de subirla.
 */
export async function compressImageToWebp(
  uri: string
): Promise<{ uri: string; base64?: string; mimeType: 'image/webp' }> {
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: MAX_IMAGE_DIMENSION,
    maxHeight: MAX_IMAGE_DIMENSION,
  });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;
  try {
    rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.WEBP,
      compress: WEBP_COMPRESS_QUALITY,
      base64: true,
    });
    return {
      uri: saved.uri,
      base64: saved.base64,
      mimeType: 'image/webp',
    };
  } finally {
    rendered?.release();
    context.release();
  }
}

/**
 * Sube una foto (comprimida en WebP) al bucket público `product-images` en la carpeta del comercio.
 */
export async function uploadPosImageToStorage(
  merchantId: string,
  folder: 'products' | 'categories',
  draft: PosImageUploadDraft,
  entityIdHint?: string
): Promise<string | null> {
  const rawUri = draft.imageUri?.trim() ?? '';
  if (!rawUri) {
    return null;
  }

  if (rawUri.startsWith('http://') || rawUri.startsWith('https://')) {
    return rawUri;
  }

  let targetUri = rawUri;
  let targetBase64 = draft.imageBase64 ?? null;
  let contentType = 'image/webp';
  let extension = 'webp';

  try {
    const compressed = await compressImageToWebp(rawUri);
    targetUri = compressed.uri;
    if (compressed.base64) {
      targetBase64 = compressed.base64;
    }
  } catch {
    // Respaldo si la plataforma no soporta codificación WebP en memoria (p. ej. Safari antiguo)
    const fallbackMeta = inferFallbackMeta(rawUri, draft.imageMimeType);
    contentType = fallbackMeta.contentType;
    extension = fallbackMeta.extension;
  }

  let payloadBytes: ArrayBuffer | Uint8Array;
  if (targetBase64) {
    payloadBytes = decodeBase64ToBytes(targetBase64);
  } else {
    const response = await fetch(targetUri);
    payloadBytes = await response.arrayBuffer();
  }

  const fileKey = `${merchantId}/${folder}/${entityIdHint ?? generateIdempotencyKey()}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(fileKey, payloadBytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error('No pudimos subir la foto al almacenamiento. Verifica tu conexión.');
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileKey);
  return data.publicUrl;
}
