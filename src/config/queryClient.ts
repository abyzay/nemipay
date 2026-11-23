import { QueryClient } from '@tanstack/react-query';
import {
  isAbortError,
  isApiError,
  isNetworkError,
  isResponseValidationError,
  isSessionExpiredError,
  isTimeoutError,
} from '@/services/api/errors';

const MAX_QUERY_RETRIES = 2;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }

  if (isAbortError(error) || isSessionExpiredError(error) || isResponseValidationError(error)) {
    return false;
  }

  if (isApiError(error)) {
    return error.isRetryable;
  }

  return isNetworkError(error) || isTimeoutError(error);
}

export function computeRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 8000);
}

/**
 * Crea un QueryClient configurado con criterios fintech:
 * - Reintentos controlados solo para lecturas con fallos transitorios.
 * - `retry: false` obligatorio en mutaciones para evitar cobros u órdenes duplicadas.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
        retryDelay: computeRetryDelay,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
