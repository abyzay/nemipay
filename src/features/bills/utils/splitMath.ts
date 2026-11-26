export const MIN_BILL_TOTAL_CENTS = 200;
export const MIN_SHARE_CENTS = 100;
export const MIN_EQUAL_PEOPLE = 2;
export const MAX_EQUAL_PEOPLE = 4;
export const MAX_SPLIT_PEOPLE = 4;
export const MAX_LABEL_LENGTH = 20;

export interface EqualSharePreview {
  position: number;
  label: string;
  shareCents: number;
}

/**
 * Reparto equitativo en centavos enteros (sin float), idéntico a `public.create_bill`.
 * El residuo `totalCents % people` se reparte +1 centavo a las primeras `r` personas.
 */
export function computeEqualShares(totalCents: number, people: number): EqualSharePreview[] {
  if (!Number.isInteger(totalCents) || totalCents < MIN_BILL_TOTAL_CENTS) {
    throw new Error('El total de la cuenta debe ser de al menos $2.00 MXN.');
  }
  if (!Number.isInteger(people) || people < MIN_EQUAL_PEOPLE || people > MAX_EQUAL_PEOPLE) {
    throw new Error(
      `El número de personas debe estar entre ${MIN_EQUAL_PEOPLE} y ${MAX_EQUAL_PEOPLE}.`
    );
  }

  const base = Math.floor(totalCents / people);
  const remainder = totalCents % people;
  if (base < MIN_SHARE_CENTS) {
    throw new Error('Cada parte debe ser de al menos $1.00 MXN.');
  }

  const result: EqualSharePreview[] = [];
  for (let i = 1; i <= people; i += 1) {
    result.push({
      position: i,
      label: `Persona ${i}`,
      shareCents: base + (i <= remainder ? 1 : 0),
    });
  }
  return result;
}

export function getMaxEqualPeopleForTotal(totalCents: number): number {
  if (!Number.isInteger(totalCents) || totalCents < MIN_BILL_TOTAL_CENTS) {
    return MIN_EQUAL_PEOPLE;
  }
  return Math.max(
    MIN_EQUAL_PEOPLE,
    Math.min(MAX_EQUAL_PEOPLE, Math.floor(totalCents / MIN_SHARE_CENTS))
  );
}

export function computeCustomRemainingCents(
  totalCents: number,
  shares: readonly { amountCents: number }[]
): number {
  const assigned = shares.reduce(
    (sum, item) => sum + (Number.isInteger(item.amountCents) ? item.amountCents : 0),
    0
  );
  return totalCents - assigned;
}

export function validateCustomShares(
  totalCents: number,
  shares: readonly { label?: string; amountCents: number }[]
): string | null {
  if (shares.length < MIN_EQUAL_PEOPLE || shares.length > MAX_EQUAL_PEOPLE) {
    return `Agrega entre ${MIN_EQUAL_PEOPLE} y ${MAX_EQUAL_PEOPLE} partes.`;
  }

  for (let i = 0; i < shares.length; i += 1) {
    const share = shares[i];
    if (!share) continue;
    const cleanLabel = (share.label ?? '').trim();
    if (cleanLabel.length > MAX_LABEL_LENGTH) {
      return `La etiqueta de la parte ${i + 1} no puede exceder ${MAX_LABEL_LENGTH} caracteres.`;
    }
    if (!Number.isInteger(share.amountCents) || share.amountCents < MIN_SHARE_CENTS) {
      return `La parte ${i + 1} debe ser de al menos $1.00 MXN.`;
    }
  }

  const remaining = computeCustomRemainingCents(totalCents, shares);
  if (remaining !== 0) {
    return remaining > 0
      ? 'Falta asignar saldo para cubrir el total.'
      : 'El total asignado excede la cuenta.';
  }

  return null;
}
