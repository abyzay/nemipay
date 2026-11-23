import { logger } from '@/utils/logger';
import { API_CONFIG, getAuthTokenProvider, getSessionExpiredHandler } from './config';
import {
  ApiError,
  NetworkError,
  ResponseValidationError,
  SessionExpiredError,
  TimeoutError,
  isAbortError,
} from './errors';
import type { ApiErrorPayload, ApiRequestOptions, QueryParams } from './types';

function buildUrl(baseUrl: string, path: string, params?: QueryParams): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

function createCombinedSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number
): {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = (): void => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const rawText = await response.text();
  if (!rawText.trim()) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (
    contentType.includes('application/json') ||
    rawText.trim().startsWith('{') ||
    rawText.trim().startsWith('[')
  ) {
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      throw new ApiError({
        status: response.status,
        code: 'INVALID_JSON_RESPONSE',
        message: 'La respuesta del servidor no contiene JSON válido.',
        isRetryable: false,
      });
    }
  }

  return rawText;
}

function extractErrorPayload(payload: unknown): ApiErrorPayload {
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    return {
      code: typeof record.code === 'string' ? record.code : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
      details: record.details,
    };
  }
  return {};
}

/**
 * Cliente HTTP centralizado basado exclusivamente en la Fetch API nativa de React Native.
 */
export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TResponse, TBody> = {}
): Promise<TResponse> {
  const {
    method = 'GET',
    params,
    body,
    headers: customHeaders,
    timeoutMs = API_CONFIG.timeoutMs,
    signal: externalSignal,
    idempotencyKey,
    skipAuth = false,
    schema,
  } = options;

  const url = buildUrl(API_CONFIG.baseUrl, path, params);
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
    ...customHeaders,
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  if (!skipAuth) {
    const tokenProvider = getAuthTokenProvider();
    const token = tokenProvider ? await tokenProvider() : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const hasBody = body !== undefined && method !== 'GET';
  const serializedBody = hasBody ? JSON.stringify(body) : undefined;
  if (!hasBody && !customHeaders?.['Content-Type']) {
    delete headers['Content-Type'];
  }

  const { signal, didTimeout, cleanup } = createCombinedSignal(externalSignal, timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
      signal,
    });

    const parsedBody = await parseResponseBody(response);

    if (response.status === 401) {
      const errorPayload = extractErrorPayload(parsedBody);
      const sessionHandler = getSessionExpiredHandler();
      if (sessionHandler) {
        await sessionHandler();
      }
      throw new SessionExpiredError(errorPayload.message, errorPayload.details);
    }

    if (!response.ok) {
      const errorPayload = extractErrorPayload(parsedBody);
      throw new ApiError({
        status: response.status,
        code: errorPayload.code ?? `HTTP_${response.status}`,
        message: errorPayload.message ?? `Error HTTP ${response.status}`,
        details: errorPayload.details ?? parsedBody,
        isRetryable: response.status === 408 || response.status === 429 || response.status >= 500,
      });
    }

    if (schema) {
      const validation = schema.safeParse(parsedBody);
      if (!validation.success) {
        throw new ResponseValidationError(validation.error.issues);
      }
      return validation.data;
    }

    return parsedBody as TResponse;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ResponseValidationError) {
      throw error;
    }

    if (didTimeout()) {
      throw new TimeoutError(timeoutMs);
    }

    if (isAbortError(error)) {
      throw error;
    }

    logger.warn('Fallo de red en solicitud HTTP', { method, path });
    throw new NetworkError(undefined, error);
  } finally {
    cleanup();
  }
}

export const apiClient = {
  get: <TResponse>(
    path: string,
    options?: Omit<ApiRequestOptions<TResponse, never>, 'method' | 'body'>
  ): Promise<TResponse> => apiRequest<TResponse, never>(path, { ...options, method: 'GET' }),

  post: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TResponse, TBody>, 'method' | 'body'>
  ): Promise<TResponse> => apiRequest<TResponse, TBody>(path, { ...options, method: 'POST', body }),

  put: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TResponse, TBody>, 'method' | 'body'>
  ): Promise<TResponse> => apiRequest<TResponse, TBody>(path, { ...options, method: 'PUT', body }),

  patch: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TResponse, TBody>, 'method' | 'body'>
  ): Promise<TResponse> =>
    apiRequest<TResponse, TBody>(path, { ...options, method: 'PATCH', body }),

  delete: <TResponse>(
    path: string,
    options?: Omit<ApiRequestOptions<TResponse, never>, 'method' | 'body'>
  ): Promise<TResponse> => apiRequest<TResponse, never>(path, { ...options, method: 'DELETE' }),
};
