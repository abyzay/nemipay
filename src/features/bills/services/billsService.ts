import { z } from 'zod';
import type { ChargeItemSnapshot } from '@/features/payments/types';
import { apiClient } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import type {
  BillDetail,
  BillParticipantDetail,
  BillSummary,
  CancelBillResponse,
  CreateBillInput,
  CreateBillResponse,
  CreateShareChargeInput,
  CreateShareChargeResponse,
} from '../types';

type DbBillRow = Database['public']['Tables']['bills']['Row'];

const billStatusEnum = z.enum(['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED']);
const splitModeEnum = z.enum(['EQUAL', 'CUSTOM', 'FREE']);
const chargeStatusEnum = z.enum([
  'CREATING',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'EXPIRED',
  'FAILED',
  'CANCELLED',
  'UNDER_REVIEW',
]);
const shareStateEnum = z.enum(['PAID', 'PAYING', 'PENDING', 'REVIEW']);

const chargeItemSnapshotSchema = z.object({
  productId: z.string(),
  name: z.string(),
  priceCents: z.number().int(),
  quantity: z.number().int(),
});

const createBillResponseSchema = z.object({
  billId: z.string().uuid(),
  totalCents: z.number().int(),
  status: billStatusEnum,
  splitMode: splitModeEnum,
  concept: z.string(),
  expiresAt: z.string(),
  participants: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int(),
      label: z.string(),
      shareCents: z.number().int().nullable(),
    })
  ),
});

const createShareChargeResponseSchema = z.object({
  chargeId: z.string().uuid(),
  billId: z.string().uuid().nullable(),
  participantId: z.string().uuid().nullable(),
  amountCents: z.number().int(),
  qrPayload: z.string().nullable(),
  expiresAt: z.string(),
  status: chargeStatusEnum,
});

const cancelBillResponseSchema = z.object({
  billId: z.string().uuid(),
  status: billStatusEnum,
  closedAt: z.string().nullable(),
});

const rpcBillSchema = z.object({
  id: z.string().uuid(),
  concept: z.string(),
  items: z.unknown().nullable().optional(),
  total_cents: z.number().int(),
  split_mode: splitModeEnum,
  status: billStatusEnum,
  collected_cents: z.number().int(),
  overpaid_cents: z.number().int(),
  expires_at: z.string(),
  closed_at: z.string().nullable(),
  created_at: z.string(),
});

const rpcParticipantSchema = z.object({
  id: z.string().uuid(),
  bill_id: z.string().uuid(),
  position: z.number().int(),
  label: z.string(),
  share_cents: z.number().int().nullable(),
  created_at: z.string(),
  state: shareStateEnum,
  paid_at: z.string().nullable(),
  charge: z
    .object({
      id: z.string().uuid(),
      status: chargeStatusEnum,
      amount_cents: z.number().int(),
      qr_payload: z.string().nullable(),
      expires_at: z.string(),
      paid_at: z.string().nullable(),
      paid_after_expiry: z.boolean(),
      created_at: z.string(),
    })
    .nullable(),
});

const rpcBillDetailSchema = z.object({
  bill: rpcBillSchema,
  participants: z.array(rpcParticipantSchema),
});

function parseItemsSnapshot(raw: unknown): ChargeItemSnapshot[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed = raw
    .map((entry) => chargeItemSnapshotSchema.safeParse(entry))
    .filter((res) => res.success)
    .map((res) => res.data);
  return parsed.length > 0 ? parsed : null;
}

export function mapDbBillRowToSummary(row: DbBillRow): BillSummary {
  return {
    id: row.id,
    concept: row.concept,
    items: parseItemsSnapshot(row.items),
    totalCents: row.total_cents,
    splitMode: row.split_mode,
    status: row.status,
    collectedCents: row.collected_cents,
    overpaidCents: row.overpaid_cents,
    expiresAt: row.expires_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

export async function createBill(
  input: CreateBillInput,
  idempotencyKey: string
): Promise<CreateBillResponse> {
  return await apiClient.post<CreateBillResponse, CreateBillInput>('/create-bill', input, {
    idempotencyKey,
    schema: createBillResponseSchema,
  });
}

export async function createShareCharge(
  input: CreateShareChargeInput,
  idempotencyKey: string
): Promise<CreateShareChargeResponse> {
  return await apiClient.post<CreateShareChargeResponse, CreateShareChargeInput>(
    '/create-share-charge',
    input,
    {
      idempotencyKey,
      schema: createShareChargeResponseSchema,
    }
  );
}

export async function cancelBill(billId: string): Promise<CancelBillResponse> {
  return await apiClient.post<CancelBillResponse, { billId: string }>(
    '/cancel-bill',
    { billId },
    { schema: cancelBillResponseSchema }
  );
}

export async function fetchBillDetail(billId: string): Promise<BillDetail> {
  const { data, error } = await supabase.rpc('get_bill_detail', {
    p_bill_id: billId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No se encontró la cuenta compartida.');
  }

  const parsed = rpcBillDetailSchema.parse(data);

  const bill: BillSummary = {
    id: parsed.bill.id,
    concept: parsed.bill.concept,
    items: parseItemsSnapshot(parsed.bill.items),
    totalCents: parsed.bill.total_cents,
    splitMode: parsed.bill.split_mode,
    status: parsed.bill.status,
    collectedCents: parsed.bill.collected_cents,
    overpaidCents: parsed.bill.overpaid_cents,
    expiresAt: parsed.bill.expires_at,
    closedAt: parsed.bill.closed_at,
    createdAt: parsed.bill.created_at,
  };

  const participants: BillParticipantDetail[] = parsed.participants.map((p) => ({
    id: p.id,
    billId: p.bill_id,
    position: p.position,
    label: p.label,
    shareCents: p.share_cents,
    createdAt: p.created_at,
    state: p.state,
    paidAt: p.paid_at,
    charge: p.charge
      ? {
          id: p.charge.id,
          status: p.charge.status,
          amountCents: p.charge.amount_cents,
          qrPayload: p.charge.qr_payload,
          expiresAt: p.charge.expires_at,
          paidAt: p.charge.paid_at,
          paidAfterExpiry: p.charge.paid_after_expiry,
          createdAt: p.charge.created_at,
        }
      : null,
  }));

  return { bill, participants };
}

export async function fetchOpenBills(): Promise<BillSummary[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_participants(id), charges(status)')
    .in('status', ['OPEN', 'PARTIALLY_PAID'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const summary = mapDbBillRowToSummary(row);
    const participantsArr = Array.isArray(
      (row as { bill_participants?: unknown }).bill_participants
    )
      ? (row as { bill_participants: { id: string }[] }).bill_participants
      : [];
    const chargesArr = Array.isArray((row as { charges?: unknown }).charges)
      ? (row as { charges: { status: string }[] }).charges
      : [];
    const paidCount = chargesArr.filter((c) => c.status === 'CONFIRMED').length;

    return {
      ...summary,
      participantsCount: participantsArr.length,
      paidParticipantsCount: paidCount,
    };
  });
}
