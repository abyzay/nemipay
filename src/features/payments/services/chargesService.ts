import { z } from 'zod';
import { apiClient } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import type { Charge, ChargeItemSnapshot, CreateChargeInput, DailySummary } from '../types';

type DbChargeRow = Database['public']['Tables']['charges']['Row'];

const chargeItemSnapshotSchema = z.object({
  productId: z.string(),
  name: z.string(),
  priceCents: z.number().int(),
  quantity: z.number().int(),
});

const chargeDtoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'CREATING',
    'AWAITING_PAYMENT',
    'CONFIRMED',
    'EXPIRED',
    'FAILED',
    'CANCELLED',
    'UNDER_REVIEW',
  ]),
  amountCents: z.number().int(),
  currency: z.string(),
  concept: z.string(),
  items: z.array(chargeItemSnapshotSchema).nullable(),
  qrPayload: z.string().nullable(),
  peyReference: z.string().nullable().optional(),
  peyTransactionId: z.string().nullable().optional(),
  expiresAt: z.string(),
  paidAt: z.string().nullable(),
  paidAfterExpiry: z.boolean(),
  failureReason: z.string().nullable(),
  billId: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
});

export function mapDbChargeRowToCharge(row: DbChargeRow): Charge {
  const parsedItems = Array.isArray(row.items)
    ? (row.items
        .map((entry) => chargeItemSnapshotSchema.safeParse(entry))
        .filter((res) => res.success)
        .map((res) => res.data) as ChargeItemSnapshot[])
    : null;

  return {
    id: row.id,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    concept: row.concept,
    items: parsedItems,
    qrPayload: row.qr_payload,
    peyReference: row.pey_reference,
    peyTransactionId: row.pey_transaction_id,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    paidAfterExpiry: row.paid_after_expiry,
    failureReason: row.failure_reason,
    billId: row.bill_id ?? null,
    createdAt: row.created_at,
  };
}

export async function createCharge(
  input: CreateChargeInput,
  idempotencyKey: string
): Promise<Charge> {
  return await apiClient.post<Charge, CreateChargeInput>('/create-charge', input, {
    idempotencyKey,
    schema: chargeDtoSchema,
  });
}

export async function checkCharge(chargeId: string): Promise<Charge> {
  return await apiClient.post<Charge, { chargeId: string }>(
    '/check-charge',
    { chargeId },
    { schema: chargeDtoSchema }
  );
}

export async function cancelCharge(chargeId: string): Promise<Charge> {
  return await apiClient.post<Charge, { chargeId: string }>(
    '/cancel-charge',
    { chargeId },
    { schema: chargeDtoSchema }
  );
}

export async function fetchChargeById(chargeId: string): Promise<Charge> {
  const { data, error } = await supabase.from('charges').select('*').eq('id', chargeId).single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se encontró el cobro.');
  }

  return mapDbChargeRowToCharge(data);
}

export async function fetchDailySummary(): Promise<DailySummary> {
  const { data, error } = await supabase.rpc('daily_summary');

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalConfirmedCents: Number(row?.total_confirmed_cents ?? 0),
    countConfirmed: Number(row?.count_confirmed ?? 0),
  };
}
