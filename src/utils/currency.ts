import type { CurrencyCode } from '@/types/common';

export interface FormatCurrencyOptions {
  currency?: CurrencyCode;
  showPlusSign?: boolean;
}

/**
 * Formatea montos enteros en centavos a moneda MXN de forma determinista
 * entre motores JS (Hermes, Web y Jest).
 */
export function formatCurrencyFromCents(
  amountCents: number,
  options: FormatCurrencyOptions = {}
): string {
  const { showPlusSign = false } = options;
  const isNegative = amountCents < 0;
  const absoluteCents = Math.abs(Math.round(amountCents));
  const wholeUnits = Math.floor(absoluteCents / 100);
  const cents = absoluteCents % 100;

  const formattedWhole = wholeUnits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedCents = cents.toString().padStart(2, '0');
  const prefix = isNegative ? '-' : showPlusSign && absoluteCents > 0 ? '+' : '';

  return `${prefix}$${formattedWhole}.${formattedCents}`;
}
