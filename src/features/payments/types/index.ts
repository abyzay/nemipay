import type { ChargeStatus as DbChargeStatus } from '@/types/database';

/**
 * Regla fundamental de seguridad financiera en NemiPay:
 * La aplicación cliente NUNCA determina por sí sola que un pago fue recibido.
 * Toda confirmación válida debe provenir del servidor.
 */
export type ChargeStatus = DbChargeStatus;

export const TERMINAL_OR_STOP_STATUSES: ReadonlySet<ChargeStatus> = new Set([
  'CONFIRMED',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
  'UNDER_REVIEW',
]);

export interface ChargeItemSnapshot {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface Charge {
  id: string;
  status: ChargeStatus;
  amountCents: number;
  currency: string;
  concept: string;
  items: ChargeItemSnapshot[] | null;
  qrPayload: string | null;
  peyReference?: string | null;
  peyTransactionId?: string | null;
  expiresAt: string;
  paidAt: string | null;
  paidAfterExpiry: boolean;
  failureReason: string | null;
  billId?: string | null;
  createdAt: string;
}

export type CreateChargeInput =
  | {
      amountCents: number;
      concept?: string;
    }
  | {
      items: { productId: string; quantity: number }[];
    };

export interface DailySummary {
  totalConfirmedCents: number;
  countConfirmed: number;
}
