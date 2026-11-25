import { z } from 'zod';
import { DEFAULT_API_TIMEOUT_MS } from '@/constants/app';
import type { AppEnvironment } from '@/types/common';

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
  EXPO_PUBLIC_SUPABASE_URL: z
    .string({ error: 'EXPO_PUBLIC_SUPABASE_URL es obligatoria.' })
    .trim()
    .url('EXPO_PUBLIC_SUPABASE_URL debe ser una URL válida.'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: 'EXPO_PUBLIC_SUPABASE_ANON_KEY es obligatoria.' })
    .trim()
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY es obligatoria.'),
  EXPO_PUBLIC_API_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(60_000)
    .default(DEFAULT_API_TIMEOUT_MS),
  EXPO_PUBLIC_MAX_CHARGE_CENTS: z.coerce.number().int().min(100).default(9_999_900),
});

export interface AppEnvConfig {
  appEnv: AppEnvironment;
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  maxChargeCents: number;
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
    EXPO_PUBLIC_SUPABASE_URL: rawEnv.EXPO_PUBLIC_SUPABASE_URL || undefined,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: rawEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || undefined,
    EXPO_PUBLIC_API_TIMEOUT_MS: rawEnv.EXPO_PUBLIC_API_TIMEOUT_MS || undefined,
    EXPO_PUBLIC_MAX_CHARGE_CENTS: rawEnv.EXPO_PUBLIC_MAX_CHARGE_CENTS || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración de variables de entorno inválida: ${details}`);
  }

  const normalizedSupabaseUrl = parsed.data.EXPO_PUBLIC_SUPABASE_URL.replace(/\/+$/, '');

  return {
    appEnv: parsed.data.EXPO_PUBLIC_APP_ENV,
    supabaseUrl: normalizedSupabaseUrl,
    supabaseAnonKey: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: `${normalizedSupabaseUrl}/functions/v1`,
    apiTimeoutMs: parsed.data.EXPO_PUBLIC_API_TIMEOUT_MS,
    maxChargeCents: parsed.data.EXPO_PUBLIC_MAX_CHARGE_CENTS,
  };
}

export const env: AppEnvConfig = getEnvConfig();
export const isDevelopment = env.appEnv === 'development';
export const isProduction = env.appEnv === 'production';
