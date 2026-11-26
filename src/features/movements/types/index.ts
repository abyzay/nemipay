import type { ChargeStatus } from '@/features/payments/types';
import type { CurrencyCode } from '@/types/common';

export type MovementStatus = ChargeStatus;

export type MovementFilter = 'all' | 'received' | 'pending' | 'other';

export interface TodayMovement {
  id: string;
  concept: string;
  amountCents: number;
  currency: CurrencyCode;
  timeLabel: string;
  status: MovementStatus;
  paidAfterExpiry: boolean;
  billId?: string | null;
  createdAt: string;
}

export interface MovementsPage {
  items: TodayMovement[];
  nextPage: number | null;
  totalCount: number | null;
}
