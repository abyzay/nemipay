import { z } from 'zod';
import {
  ApiError,
  NetworkError,
  ResponseValidationError,
  SessionExpiredError,
  TimeoutError,
  apiClient,
  setAuthTokenProvider,
  setSessionExpiredHandler,
} from '@/services/api';

function createJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

describe('Capa HTTP centralizada sobre Fetch API nativa', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthTokenProvider(null);
    setSessionExpiredHandler(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('realiza GET con query params y valida la respuesta con Zod', async () => {
    const fetchMock = jest.fn().mockResolvedValue(createJsonResponse({ ok: true, count: 3 }, 200));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const schema = z.object({ ok: z.boolean(), count: z.number() });
    const data = await apiClient.get('/health', {
      params: { env: 'dev', limit: 10, ignored: undefined },
      schema,
    });

    expect(data).toEqual({ ok: true, count: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('/health?env=dev&limit=10');
    expect(calledInit.method).toBe('GET');
  });

  it('serializa cuerpo JSON, adjunta Authorization e Idempotency-Key en POST', async () => {
    setAuthTokenProvider(async () => 'test-session-token');
    const fetchMock = jest.fn().mockResolvedValue(createJsonResponse({ created: true }, 201));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiClient.post(
      '/sample',
      { amountCents: 1500 },
      { idempotencyKey: 'idem-123' }
    );

    expect(result).toEqual({ created: true });
    const [, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-session-token');
    expect(headers['Idempotency-Key']).toBe('idem-123');
    expect(headers['Content-Type']).toBe('application/json');
    expect(calledInit.body).toBe(JSON.stringify({ amountCents: 1500 }));
  });

  it('maneja respuestas vacías 204 No Content sin error de parseo', async () => {
    const fetchMock = jest.fn().mockResolvedValue(createJsonResponse(undefined, 204));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiClient.delete<void>('/resource/1');
    expect(result).toBeUndefined();
  });

  it('lanza ResponseValidationError cuando el esquema Zod falla', async () => {
    const fetchMock = jest.fn().mockResolvedValue(createJsonResponse({ unexpected: 'shape' }, 200));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const schema = z.object({ id: z.string() });
    await expect(apiClient.get('/invalid', { schema })).rejects.toBeInstanceOf(
      ResponseValidationError
    );
  });

  it('lanza SessionExpiredError e invoca el manejador de sesión en HTTP 401', async () => {
    const onExpired = jest.fn();
    setSessionExpiredHandler(onExpired);

    const fetchMock = jest
      .fn()
      .mockResolvedValue(createJsonResponse({ message: 'Token expirado' }, 401));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/protected')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('distingue errores HTTP 4xx no reintentables de 5xx reintentables', async () => {
    const fetchBadRequest = jest
      .fn()
      .mockResolvedValue(
        createJsonResponse({ code: 'INVALID_INPUT', message: 'Dato inválido' }, 400)
      );
    globalThis.fetch = fetchBadRequest as unknown as typeof fetch;

    await expect(apiClient.post('/validate', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      isRetryable: false,
    });

    const fetchServerError = jest
      .fn()
      .mockResolvedValue(createJsonResponse({ message: 'Error interno' }, 500));
    globalThis.fetch = fetchServerError as unknown as typeof fetch;

    try {
      await apiClient.get('/server-error');
      fail('Debió lanzar ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).isRetryable).toBe(true);
    }
  });

  it('convierte fallos de red en NetworkError', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/offline')).rejects.toBeInstanceOf(NetworkError);
  });

  it('lanza TimeoutError cuando excede timeoutMs', async () => {
    const fetchMock = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const abortErr = new Error('Aborted');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/slow', { timeoutMs: 25 })).rejects.toBeInstanceOf(TimeoutError);
  });

  it('respeta la cancelación externa mediante AbortController', async () => {
    const controller = new AbortController();
    const fetchMock = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const abortErr = new Error('Aborted');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const promise = apiClient.get('/cancellable', { signal: controller.signal, timeoutMs: 5000 });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
