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
  created_at: string;
  updated_at: string;
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
    createdAt: row.created_at,
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
  };
}
