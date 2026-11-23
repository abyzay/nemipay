import type { CurrencyCode, IdempotencyKey, IsoDateString } from '@/types/common';

/**
 * Regla fundamental de seguridad financiera en NemiPay:
 * La aplicación móvil NUNCA determina por sí sola que un pago fue recibido.
 * Toda confirmación válida debe provenir del backend tras validar la operación.
 */
export type PaymentVerificationSource = 'backend';

export type PaymentOrderStatus =
  'pending' | 'awaiting_payment' | 'confirmed' | 'expired' | 'cancelled' | 'failed';

export interface BasePaymentOrderReference {
  orderId: string;
  amountCents: number;
  currency: CurrencyCode;
  status: PaymentOrderStatus;
  verifiedBy: PaymentVerificationSource;
  idempotencyKey?: IdempotencyKey;
  createdAt: IsoDateString;
}
