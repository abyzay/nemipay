const SENSITIVE_KEY_PATTERN =
  /^(authorization|token|access_?token|refresh_?token|password|secret|pin|api_?key|cookie|set-cookie)$/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(entry, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Logger seguro de infraestructura:
 * - Solo emite logs en modo desarrollo (`__DEV__`).
 * - Redacta automáticamente llaves sensibles (tokens, autorización, contraseñas, secretos).
 */
export const logger = {
  debug(message: string, context?: unknown): void {
    if (!__DEV__) return;
    if (context !== undefined) {
      console.debug(`[NemiPay] ${message}`, sanitizeValue(context));
      return;
    }
    console.debug(`[NemiPay] ${message}`);
  },

  warn(message: string, context?: unknown): void {
    if (!__DEV__) return;
    if (context !== undefined) {
      console.warn(`[NemiPay] ${message}`, sanitizeValue(context));
      return;
    }
    console.warn(`[NemiPay] ${message}`);
  },

  error(message: string, context?: unknown): void {
    if (!__DEV__) return;
    if (context !== undefined) {
      console.error(`[NemiPay] ${message}`, sanitizeValue(context));
      return;
    }
    console.error(`[NemiPay] ${message}`);
  },
};
