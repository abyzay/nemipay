import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type ChargeStatus =
  | 'CREATING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNDER_REVIEW';

export interface ChargeItemSnapshot {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export type SplitMode = 'EQUAL' | 'CUSTOM' | 'FREE';

export type BillStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface ChargeRow {
  id: string;
  merchant_id: string;
  amount_cents: number;
  currency: string;
  concept: string;
  items: ChargeItemSnapshot[] | null;
  status: ChargeStatus;
  idempotency_key: string;
  request_hash: string;
  pey_reference: string | null;
  pey_transaction_id: string | null;
  qr_payload: string | null;
  expires_at: string;
  paid_at: string | null;
  paid_after_expiry: boolean;
  failure_reason: string | null;
  last_checked_at: string | null;
  bill_id?: string | null;
  participant_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillRow {
  id: string;
  merchant_id: string;
  concept: string;
  items: ChargeItemSnapshot[] | null;
  total_cents: number;
  split_mode: SplitMode;
  status: BillStatus;
  idempotency_key: string;
  request_hash: string;
  collected_cents: number;
  overpaid_cents: number;
  expires_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillParticipantRow {
  id: string;
  bill_id: string;
  position: number;
  label: string;
  share_cents: number | null;
  created_at: string;
}

export interface BillParticipantDto {
  id: string;
  position: number;
  label: string;
  shareCents: number | null;
}

export interface CreateBillRpcResult {
  isReplay: boolean;
  bill: BillRow;
  participants: BillParticipantRow[];
}

export interface ProductRow {
  id: string;
  merchant_id: string;
  name: string;
  price_cents: number;
  active: boolean;
}

export interface WebhookEventRow {
  id: string;
  webhook_id: string;
  type: string | null;
  payload: unknown;
  received_at: string;
  processed_at: string | null;
  error: string | null;
}

export interface ChargeDto {
  id: string;
  status: ChargeStatus;
  amountCents: number;
  currency: string;
  concept: string;
  items: ChargeItemSnapshot[] | null;
  qrPayload: string | null;
  expiresAt: string;
  paidAt: string | null;
  paidAfterExpiry: boolean;
  failureReason: string | null;
  billId: string | null;
  participantId: string | null;
  createdAt: string;
}

export function toChargeDto(row: ChargeRow): ChargeDto {
  return {
    id: row.id,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    concept: row.concept,
    items: row.items,
    qrPayload: row.qr_payload,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    paidAfterExpiry: row.paid_after_expiry,
    failureReason: row.failure_reason,
    billId: row.bill_id ?? null,
    participantId: row.participant_id ?? null,
    createdAt: row.created_at,
  };
}

export function toBillParticipantDto(row: BillParticipantRow): BillParticipantDto {
  return {
    id: row.id,
    position: row.position,
    label: row.label,
    shareCents: row.share_cents,
  };
}

export function createSupabaseAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface EdgeRepository {
  countRecentCharges(merchantId: string, sinceIso: string): Promise<number>;
  findChargeByIdempotencyKey(merchantId: string, idempotencyKey: string): Promise<ChargeRow | null>;
  findActiveProductsByIds(merchantId: string, productIds: string[]): Promise<ProductRow[]>;
  insertCreatingCharge(input: {
    merchantId: string;
    amountCents: number;
    concept: string;
    items: ChargeItemSnapshot[] | null;
    idempotencyKey: string;
    requestHash: string;
    expiresAt: string;
  }): Promise<ChargeRow>;
  getChargeById(chargeId: string): Promise<ChargeRow | null>;
  findChargeByPeyReference(peyReference: string): Promise<ChargeRow | null>;
  claimCheckTurn(chargeId: string, minAgeSeconds: number): Promise<ChargeRow | null>;
  applyTransition(params: {
    chargeId: string;
    to: ChargeStatus;
    peyReference?: string | null;
    peyTransactionId?: string | null;
    qrPayload?: string | null;
    paidAt?: string | null;
    failureReason?: string | null;
  }): Promise<ChargeRow>;
  insertWebhookEvent(input: {
    webhookId: string;
    type: string | null;
    payload: unknown;
  }): Promise<{ inserted: boolean; eventId: string | null }>;
  markWebhookProcessed(webhookId: string, error?: string | null): Promise<void>;
  listChargesForReconciliation(limit: number): Promise<ChargeRow[]>;
  createBill(input: {
    merchantId: string;
    concept: string;
    items: ChargeItemSnapshot[] | null;
    totalCents: number;
    splitMode: SplitMode;
    idempotencyKey: string;
    requestHash: string;
    ttlSeconds: number;
    people?: number | null;
    shares?: { label?: string; amountCents: number }[] | null;
  }): Promise<CreateBillRpcResult>;
  reserveShare(input: {
    merchantId: string;
    billId: string;
    participantId?: string | null;
    amountCents?: number | null;
    label?: string | null;
    idempotencyKey: string;
    requestHash: string;
    ttlSeconds: number;
    maxLiveShares: number;
  }): Promise<ChargeRow>;
  cancelBill(merchantId: string, billId: string): Promise<BillRow>;
  expireStaleBills(): Promise<number>;
}

export function createSupabaseEdgeRepository(client: SupabaseClient): EdgeRepository {
  return {
    async countRecentCharges(merchantId, sinceIso) {
      const { count, error } = await client
        .from('charges')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .gte('created_at', sinceIso);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    async findChargeByIdempotencyKey(merchantId, idempotencyKey) {
      const { data, error } = await client
        .from('charges')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ChargeRow | null) ?? null;
    },

    async findActiveProductsByIds(merchantId, productIds) {
      const { data, error } = await client
        .from('products')
        .select('id, merchant_id, name, price_cents, active')
        .eq('merchant_id', merchantId)
        .eq('active', true)
        .in('id', productIds);
      if (error) throw new Error(error.message);
      return (data as ProductRow[]) ?? [];
    },

    async insertCreatingCharge(input) {
      const { data, error } = await client
        .from('charges')
        .insert({
          merchant_id: input.merchantId,
          amount_cents: input.amountCents,
          currency: 'MXN',
          concept: input.concept,
          items: input.items,
          status: 'CREATING',
          idempotency_key: input.idempotencyKey,
          request_hash: input.requestHash,
          expires_at: input.expiresAt,
        })
        .select('*')
        .single();

      if (error) {
        const err = new Error(error.message) as Error & { code?: string };
        err.code = error.code;
        throw err;
      }
      return data as ChargeRow;
    },

    async getChargeById(chargeId) {
      const { data, error } = await client
        .from('charges')
        .select('*')
        .eq('id', chargeId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ChargeRow | null) ?? null;
    },

    async findChargeByPeyReference(peyReference) {
      const { data, error } = await client
        .from('charges')
        .select('*')
        .eq('pey_reference', peyReference)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ChargeRow | null) ?? null;
    },

    async claimCheckTurn(chargeId, minAgeSeconds) {
      const thresholdIso = new Date(Date.now() - minAgeSeconds * 1000).toISOString();
      const nowIso = new Date().toISOString();
      const { data, error } = await client
        .from('charges')
        .update({ last_checked_at: nowIso })
        .eq('id', chargeId)
        .in('status', ['AWAITING_PAYMENT', 'CREATING', 'EXPIRED', 'CANCELLED'])
        .or(`last_checked_at.is.null,last_checked_at.lt.${thresholdIso}`)
        .select('*')
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data as ChargeRow | null) ?? null;
    },

    async applyTransition(params) {
      const { data, error } = await client.rpc('apply_charge_transition', {
        p_charge_id: params.chargeId,
        p_to: params.to,
        p_pey_reference: params.peyReference ?? null,
        p_pey_transaction_id: params.peyTransactionId ?? null,
        p_qr_payload: params.qrPayload ?? null,
        p_paid_at: params.paidAt ?? null,
        p_failure_reason: params.failureReason ?? null,
      });
      if (error) throw new Error(error.message);
      return data as ChargeRow;
    },

    async insertWebhookEvent(input) {
      const { data, error } = await client
        .from('webhook_events')
        .insert({
          webhook_id: input.webhookId,
          type: input.type,
          payload: input.payload,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return { inserted: false, eventId: null };
        }
        throw new Error(error.message);
      }

      return { inserted: true, eventId: (data as { id: string }).id };
    },

    async markWebhookProcessed(webhookId, errorMessage = null) {
      const { error } = await client
        .from('webhook_events')
        .update({
          processed_at: errorMessage ? null : new Date().toISOString(),
          error: errorMessage,
        })
        .eq('webhook_id', webhookId);

      if (error) throw new Error(error.message);
    },

    async listChargesForReconciliation(limit) {
      const { data, error } = await client
        .from('charges')
        .select('*')
        .in('status', ['CREATING', 'AWAITING_PAYMENT'])
        .order('created_at', { ascending: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as ChargeRow[]) ?? [];
    },

    async createBill(input) {
      const { data, error } = await client.rpc('create_bill', {
        p_merchant_id: input.merchantId,
        p_concept: input.concept,
        p_items: input.items,
        p_total_cents: input.totalCents,
        p_split_mode: input.splitMode,
        p_idempotency_key: input.idempotencyKey,
        p_request_hash: input.requestHash,
        p_ttl_seconds: input.ttlSeconds,
        p_people: input.people ?? null,
        p_shares: input.shares ?? null,
      });
      if (error) throw new Error(error.message);
      const result = data as {
        is_replay: boolean;
        bill: BillRow;
        participants: BillParticipantRow[];
      };
      return {
        isReplay: Boolean(result.is_replay),
        bill: result.bill,
        participants: result.participants ?? [],
      };
    },

    async reserveShare(input) {
      const { data, error } = await client.rpc('reserve_share', {
        p_merchant_id: input.merchantId,
        p_bill_id: input.billId,
        p_participant_id: input.participantId ?? null,
        p_amount_cents: input.amountCents ?? null,
        p_label: input.label ?? null,
        p_idempotency_key: input.idempotencyKey,
        p_request_hash: input.requestHash,
        p_ttl_seconds: input.ttlSeconds,
        p_max_live_shares: input.maxLiveShares,
      });
      if (error) throw new Error(error.message);
      return data as ChargeRow;
    },

    async cancelBill(merchantId, billId) {
      const { data, error } = await client.rpc('cancel_bill', {
        p_merchant_id: merchantId,
        p_bill_id: billId,
      });
      if (error) throw new Error(error.message);
      return data as BillRow;
    },

    async expireStaleBills() {
      const { data, error } = await client.rpc('expire_stale_bills');
      if (error) throw new Error(error.message);
      return Number(data ?? 0);
    },
  };
}
