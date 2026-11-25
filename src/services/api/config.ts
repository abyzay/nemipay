import { env } from '@/config/env';
import type { AuthTokenProvider, SessionExpiredHandler } from './types';

export const API_CONFIG = {
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
  defaultHeaders: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    apikey: env.supabaseAnonKey,
  },
} as const;

let authTokenProvider: AuthTokenProvider | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

/**
 * Registra el proveedor de token de sesión (Supabase Auth)
 * sin acoplar la capa HTTP a un módulo de autenticación concreto.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

export function getAuthTokenProvider(): AuthTokenProvider | null {
  return authTokenProvider;
}

/**
 * Registra el manejador global para respuestas 401 (sesión expirada).
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

export function getSessionExpiredHandler(): SessionExpiredHandler | null {
  return sessionExpiredHandler;
}
