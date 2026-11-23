import * as SecureStore from 'expo-secure-store';
import { logger } from '@/utils/logger';

/**
 * Llaves autorizadas para almacenamiento cifrado en dispositivo.
 * PROHIBIDO almacenar contraseñas en texto plano o llaves privadas de servidor.
 */
export const SECURE_STORAGE_KEYS = {
  ACCESS_TOKEN: 'nemipay.auth.access_token',
  REFRESH_TOKEN: 'nemipay.auth.refresh_token',
  BIOMETRIC_ENABLED: 'nemipay.security.biometric_enabled',
} as const;

export type SecureStorageKey = (typeof SECURE_STORAGE_KEYS)[keyof typeof SECURE_STORAGE_KEYS];

export async function isSecureStorageAvailable(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

export async function setSecureItem(
  key: SecureStorageKey,
  value: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    ...options,
  });
}

export async function getSecureItem(
  key: SecureStorageKey,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, options);
  } catch (error) {
    logger.warn('No se pudo leer un elemento de SecureStore', { key });
    throw error;
  }
}

export async function deleteSecureItem(
  key: SecureStorageKey,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  await SecureStore.deleteItemAsync(key, options);
}
