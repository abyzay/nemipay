const UNITS_STANDARD = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
] as const;

const UNITS_APOCOPATED = [
  'cero',
  'un',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
] as const;

const TEENS = [
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
] as const;

const TWENTIES_STANDARD = [
  'veinte',
  'veintiuno',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
] as const;

const TWENTIES_APOCOPATED = [
  'veinte',
  'veintiún',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
] as const;

const TENS = [
  '',
  '',
  'veinte',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
] as const;

const HUNDREDS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
] as const;

function underThousandToWords(n: number, apocopateOne: boolean): string {
  if (n === 0) {
    return '';
  }
  if (n === 100) {
    return 'cien';
  }

  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]!);
  }

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push((apocopateOne ? UNITS_APOCOPATED : UNITS_STANDARD)[remainder]!);
    } else if (remainder < 20) {
      parts.push(TEENS[remainder - 10]!);
    } else if (remainder < 30) {
      parts.push((apocopateOne ? TWENTIES_APOCOPATED : TWENTIES_STANDARD)[remainder - 20]!);
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (unit === 0) {
        parts.push(TENS[ten]!);
      } else {
        const unitWord = (apocopateOne ? UNITS_APOCOPATED : UNITS_STANDARD)[unit]!;
        parts.push(`${TENS[ten]} y ${unitWord}`);
      }
    }
  }

  return parts.join(' ');
}

function integerToSpanishWords(n: number): string {
  if (n === 0) {
    return 'cero';
  }

  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  const parts: string[] = [];

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mil');
    } else {
      parts.push(`${underThousandToWords(thousands, true)} mil`);
    }
  }

  if (remainder > 0) {
    parts.push(underThousandToWords(remainder, true));
  }

  return parts.join(' ');
}

/**
 * Convierte centavos enteros (0 a 9,999,999) a español natural de México.
 * Ejemplos:
 * - 100 -> "un peso"
 * - 2100 -> "veintiún pesos"
 * - 8050 -> "ochenta pesos con cincuenta centavos"
 * - 150000 -> "mil quinientos pesos"
 */
export function amountToSpanishWords(amountCents: number): string {
  const safeCents = Math.max(0, Math.round(amountCents));
  const pesos = Math.floor(safeCents / 100);
  const cents = safeCents % 100;

  const pesosWords = integerToSpanishWords(pesos);
  const pesosUnit = pesos === 1 ? 'peso' : 'pesos';
  const pesosPhrase = `${pesosWords} ${pesosUnit}`;

  if (cents === 0) {
    return pesosPhrase;
  }

  const centsWords = integerToSpanishWords(cents);
  const centsUnit = cents === 1 ? 'centavo' : 'centavos';
  return `${pesosPhrase} con ${centsWords} ${centsUnit}`;
}
