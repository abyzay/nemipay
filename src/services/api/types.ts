import type { ZodType } from 'zod';
import type { IdempotencyKey } from '@/types/common';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParamPrimitive = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryParamPrimitive>;

export interface ApiRequestOptions<TResponse, TBody = unknown> {
  method?: HttpMethod;
  params?: QueryParams;
  body?: TBody;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  idempotencyKey?: IdempotencyKey;
  skipAuth?: boolean;
  schema?: ZodType<TResponse>;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export type AuthTokenProvider = () => Promise<string | null> | string | null;
export type SessionExpiredHandler = () => Promise<void> | void;
