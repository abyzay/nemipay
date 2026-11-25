import { env } from '@/config/env';

/**
 * Convierte un string decimal (ej. "80", "80.5", "80.50") a centavos enteros
 * usando aritmética de enteros sobre el string (sin parseFloat * 100).
 */
export function parseAmountInputToCents(
  rawInput: string,
  maxChargeCents = env.maxChargeCents
): number {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.startsWith('.') ? `0${trimmed}` : trimmed;
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) {
    return 0;
  }

  const [wholeStr = '0', fracStr = ''] = normalized.split('.');
  const whole = Number.parseInt(wholeStr, 10);
  const cents = Number.parseInt(`${fracStr}00`.slice(0, 2), 10);

  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(cents)) {
    return 0;
  }

  const totalCents = whole * 100 + cents;
  if (!Number.isSafeInteger(totalCents) || totalCents > maxChargeCents) {
    return 0;
  }

  return totalCents;
}

/**
 * Aplica una tecla del teclado numérico ('0'-'9', '.', 'backspace', 'clear')
 * respetando máximo 2 decimales y el tope maxChargeCents.
 */
export function applyKeypadKey(
  currentValue: string,
  key: string,
  maxChargeCents = env.maxChargeCents
): string {
  if (key === 'clear') {
    return '';
  }

  if (key === 'backspace') {
    return currentValue.slice(0, -1);
  }

  if (key === '.') {
    if (currentValue.includes('.')) {
      return currentValue;
    }
    const next = currentValue === '' ? '0.' : `${currentValue}.`;
    return next;
  }

  if (!/^\d$/.test(key)) {
    return currentValue;
  }

  let candidate: string;
  if (currentValue === '0') {
    candidate = key === '0' ? '0' : key;
  } else {
    candidate = `${currentValue}${key}`;
  }

  if (!/^\d+(?:\.\d{0,2})?$/.test(candidate)) {
    return currentValue;
  }

  const candidateCents = parseAmountInputToCents(candidate, maxChargeCents);
  if (candidateCents === 0 && Number.parseInt(candidate.replace('.', ''), 10) > 0) {
    return currentValue;
  }

  return candidate;
}
