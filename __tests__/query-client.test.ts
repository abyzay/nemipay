import { z } from 'zod';
import { createQueryClient, shouldRetryQuery } from '@/config/queryClient';
import { paymentKeys } from '@/features/payments/queries/keys';
import {
  ApiError,
  NetworkError,
  ResponseValidationError,
  SessionExpiredError,
  TimeoutError,
} from '@/services/api';

describe('Configuración fintech de TanStack Query', () => {
  it('deshabilita reintentos automáticos en mutaciones para evitar cobros duplicados', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.mutations?.retry).toBe(false);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(300_000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('permite reintentos controlados solo en errores transitorios y máximo 2 veces', () => {
    expect(shouldRetryQuery(0, new NetworkError())).toBe(true);
    expect(shouldRetryQuery(1, new TimeoutError(5000))).toBe(true);
    expect(shouldRetryQuery(2, new NetworkError())).toBe(false);

    expect(
      shouldRetryQuery(0, new ApiError({ status: 503, code: 'UNAVAILABLE', message: 'Retryable' }))
    ).toBe(true);
    expect(
      shouldRetryQuery(0, new ApiError({ status: 400, code: 'BAD_REQUEST', message: 'Invalid' }))
    ).toBe(false);
    expect(shouldRetryQuery(0, new SessionExpiredError())).toBe(false);

    const parsed = z.object({ id: z.string() }).safeParse({});
    if (!parsed.success) {
      expect(shouldRetryQuery(0, new ResponseValidationError(parsed.error.issues))).toBe(false);
    }
  });

  it('organiza jerárquicamente las Query Keys por funcionalidad', () => {
    expect(paymentKeys.charge('chg-1')).toEqual(['payments', 'charges', 'chg-1']);
    expect(paymentKeys.chargesToday()).toEqual(['payments', 'today']);
    expect(paymentKeys.dailySummary()).toEqual(['payments', 'daily-summary']);
    expect(paymentKeys.products()).toEqual(['products']);
    expect(paymentKeys.merchant('m-1')).toEqual(['merchant', 'm-1']);
  });
});
