import type { ZodIssue } from 'zod';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isRetryable: boolean;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    isRetryable?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.isRetryable = params.isRetryable ?? params.status >= 500;
  }
}

export class NetworkError extends Error {
  readonly causeError?: unknown;

  constructor(message = 'No se pudo establecer conexión con el servidor.', causeError?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.causeError = causeError;
  }
}

export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, message = 'La solicitud excedió el tiempo máximo de espera.') {
    super(message);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = 'La sesión ha expirado. Inicia sesión nuevamente.', details?: unknown) {
    super({
      status: 401,
      code: 'SESSION_EXPIRED',
      message,
      details,
      isRetryable: false,
    });
    this.name = 'SessionExpiredError';
  }
}

export class ResponseValidationError extends Error {
  readonly issues: ZodIssue[];

  constructor(issues: ZodIssue[], message = 'La respuesta del servidor no cumple el esquema.') {
    super(message);
    this.name = 'ResponseValidationError';
    this.issues = issues;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export function isResponseValidationError(error: unknown): error is ResponseValidationError {
  return error instanceof ResponseValidationError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
