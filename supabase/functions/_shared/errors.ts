import { buildCorsHeaders } from './cors.ts';

const SENSITIVE_KEY_PATTERN =
  /^(authorization|token|access_?token|refresh_?token|password|secret|pin|api_?key|webhook-signature|x-cron-secret|cookie|set-cookie)$/i;

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? '[REDACTED]' : sanitizeLogValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function logStructured(
  level: 'info' | 'warn' | 'error',
  event: string,
  meta?: Record<string, unknown>
): void {
  const payload = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...(meta ? { meta: sanitizeLogValue(meta) } : {}),
  });
  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else {
    console.info(payload);
  }
}

export function jsonResponse(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function errorResponse(
  req: Request,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  return jsonResponse(req, status, {
    code,
    message,
    ...(details !== undefined ? { details } : {}),
  });
}
