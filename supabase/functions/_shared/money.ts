/**
 * Conversión exacta pesos <-> centavos usando aritmética de enteros sobre strings.
 * Nunca usa parseFloat * 100.
 */
export function pesosToCents(input: string | number): number {
  const raw = typeof input === 'number' ? input.toString() : input;
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,})?$/.test(trimmed)) {
    throw new Error(`Monto en pesos inválido: "${raw}"`);
  }

  const [wholePart, fracPart = ''] = trimmed.split('.');
  const paddedFrac = `${fracPart}00`.slice(0, 2);
  const trailingFrac = fracPart.slice(2);
  if (trailingFrac.length > 0 && /[1-9]/.test(trailingFrac)) {
    throw new Error(`Monto con más de 2 decimales no soportado: "${raw}"`);
  }

  const whole = Number.parseInt(wholePart, 10);
  const cents = Number.parseInt(paddedFrac, 10);
  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(cents)) {
    throw new Error(`Monto fuera de rango entero seguro: "${raw}"`);
  }

  const total = whole * 100 + cents;
  if (!Number.isSafeInteger(total)) {
    throw new Error(`Monto en centavos fuera de rango seguro: "${raw}"`);
  }
  return total;
}

export function centsToPesosString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`Centavos inválidos: ${cents}`);
  }
  const whole = Math.floor(cents / 100);
  const frac = (cents % 100).toString().padStart(2, '0');
  return `${whole}.${frac}`;
}

export function centsToPesosNumber(cents: number): number {
  return Number(centsToPesosString(cents));
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
