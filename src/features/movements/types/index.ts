import type { ChargeStatus } from '@/features/payments/types';
import type { CurrencyCode } from '@/types/common';

export type MovementStatus = ChargeStatus;

export interface TodayMovement {
  id: string;
  concept: string;
  amountCents: number;
  currency: CurrencyCode;
  timeLabel: string;
  status: MovementStatus;
  paidAfterExpiry: boolean;
}
