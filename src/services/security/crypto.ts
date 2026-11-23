import * as Crypto from 'expo-crypto';
import type { IdempotencyKey } from '@/types/common';

/**
 * Genera una llave de idempotencia criptográficamente segura (UUID v4)
 * para operaciones sensibles como creación de órdenes de cobro.
 */
export function generateIdempotencyKey(): IdempotencyKey {
  return Crypto.randomUUID();
}

export async function hashSha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}
