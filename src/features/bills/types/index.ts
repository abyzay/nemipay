import type { ChargeItemSnapshot, ChargeStatus } from '@/features/payments/types';
import type { BillStatus, SplitMode } from '@/types/database';

export type { BillStatus, SplitMode };

export type ShareState = 'PAID' | 'PAYING' | 'PENDING' | 'REVIEW';

export interface BillSummary {
  id: string;
  concept: string;
  items: ChargeItemSnapshot[] | null;
  totalCents: number;
  splitMode: SplitMode;
  status: BillStatus;
  collectedCents: number;
  overpaidCents: number;
  participantsCount?: number;
  paidParticipantsCount?: number;
  expiresAt: string;
  closedAt: string | null;
  createdAt: string;
}

export interface BillParticipantCharge {
  id: string;
  status: ChargeStatus;
  amountCents: number;
  qrPayload: string | null;
  expiresAt: string;
  paidAt: string | null;
  paidAfterExpiry: boolean;
  createdAt: string;
}

export interface BillParticipantDetail {
  id: string;
  billId: string;
  position: number;
  label: string;
  shareCents: number | null;
  createdAt: string;
  state: ShareState;
  paidAt: string | null;
  charge: BillParticipantCharge | null;
}

export interface BillDetail {
  bill: BillSummary;
  participants: BillParticipantDetail[];
}

export type SplitConfigInput =
  | { mode: 'EQUAL'; people: number }
  | { mode: 'CUSTOM'; shares: { label?: string; amountCents: number }[] }
  | { mode: 'FREE' };

export type CreateBillInput =
  | {
      amountCents: number;
      concept?: string;
      split: SplitConfigInput;
    }
  | {
      items: { productId: string; quantity: number }[];
      split: SplitConfigInput;
    };

export interface CreateBillResponse {
  billId: string;
  totalCents: number;
  status: BillStatus;
  splitMode: SplitMode;
  concept: string;
  expiresAt: string;
  participants: {
    id: string;
    position: number;
    label: string;
    shareCents: number | null;
  }[];
}

export interface CreateShareChargeInput {
  billId: string;
  participantId?: string;
  amountCents?: number;
  label?: string;
}

export interface CreateShareChargeResponse {
  chargeId: string;
  billId: string | null;
  participantId: string | null;
  amountCents: number;
  qrPayload: string | null;
  expiresAt: string;
  status: ChargeStatus;
}

export interface CancelBillResponse {
  billId: string;
  status: BillStatus;
  closedAt: string | null;
}
