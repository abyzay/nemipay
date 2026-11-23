import { z } from 'zod';
import { DEFAULT_API_TIMEOUT_MS } from '@/constants/app';
import type { AppEnvironment } from '@/types/common';

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
  EXPO_PUBLIC_API_BASE_URL: z.string().trim().url().default('https://api-dev.nemipay.example'),
  EXPO_PUBLIC_API_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(60_000)
    .default(DEFAULT_API_TIMEOUT_MS),
});

export interface AppEnvConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
  apiTimeoutMs: number;
}

/**
 * Lee y valida exclusivamente variables públicas (`EXPO_PUBLIC_*`).
 * NUNCA leer secretos privados del lado del cliente.
 */
export function getEnvConfig(
  rawEnv: Record<string, string | undefined> = process.env
): AppEnvConfig {
  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_APP_ENV: rawEnv.EXPO_PUBLIC_APP_ENV || undefined,
    EXPO_PUBLIC_API_BASE_URL: rawEnv.EXPO_PUBLIC_API_BASE_URL || undefined,
    EXPO_PUBLIC_API_TIMEOUT_MS: rawEnv.EXPO_PUBLIC_API_TIMEOUT_MS || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración de variables de entorno inválida: ${details}`);
  }

  return {
    appEnv: parsed.data.EXPO_PUBLIC_APP_ENV,
    apiBaseUrl: parsed.data.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, ''),
    apiTimeoutMs: parsed.data.EXPO_PUBLIC_API_TIMEOUT_MS,
  };
}

export const env: AppEnvConfig = getEnvConfig();
export const isDevelopment = env.appEnv === 'development';
export const isProduction = env.appEnv === 'production';
