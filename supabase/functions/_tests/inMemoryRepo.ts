import type {
  ChargeRow,
  ChargeStatus,
  EdgeRepository,
  ProductRow,
  WebhookEventRow,
} from '../_shared/supabaseAdmin.ts';

const ALLOWED_TRANSITIONS: Record<ChargeStatus, ChargeStatus[]> = {
  CREATING: [],
  AWAITING_PAYMENT: ['CREATING'],
  FAILED: ['CREATING'],
  CONFIRMED: ['AWAITING_PAYMENT', 'EXPIRED', 'CANCELLED'],
  EXPIRED: ['AWAITING_PAYMENT'],
  CANCELLED: ['AWAITING_PAYMENT'],
  UNDER_REVIEW: ['AWAITING_PAYMENT'],
};

export class InMemoryEdgeRepository implements EdgeRepository {
  readonly products = new Map<string, ProductRow>();
  readonly charges = new Map<string, ChargeRow>();
  readonly webhookEvents = new Map<string, WebhookEventRow>();
  public transitionCallsToConfirmed = 0;

  async countRecentCharges(merchantId: string, sinceIso: string): Promise<number> {
    const sinceMs = new Date(sinceIso).getTime();
    let count = 0;
    for (const c of this.charges.values()) {
      if (c.merchant_id === merchantId && new Date(c.created_at).getTime() >= sinceMs) {
        count += 1;
      }
    }
    return count;
  }

  async findChargeByIdempotencyKey(
    merchantId: string,
    idempotencyKey: string
  ): Promise<ChargeRow | null> {
    for (const c of this.charges.values()) {
      if (c.merchant_id === merchantId && c.idempotency_key === idempotencyKey) {
        return { ...c };
      }
    }
    return null;
  }

  async findActiveProductsByIds(merchantId: string, productIds: string[]): Promise<ProductRow[]> {
    const wanted = new Set(productIds);
    const results: ProductRow[] = [];
    for (const p of this.products.values()) {
      if (p.merchant_id === merchantId && p.active && wanted.has(p.id)) {
        results.push({ ...p });
      }
    }
    return results;
  }

  async insertCreatingCharge(input: {
    merchantId: string;
    amountCents: number;
    concept: string;
    items: ChargeRow['items'];
    idempotencyKey: string;
    requestHash: string;
    expiresAt: string;
  }): Promise<ChargeRow> {
    const existing = await this.findChargeByIdempotencyKey(input.merchantId, input.idempotencyKey);
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint') as Error & {
        code?: string;
      };
      err.code = '23505';
      throw err;
    }

    const nowIso = new Date().toISOString();
    const row: ChargeRow = {
      id: crypto.randomUUID(),
      merchant_id: input.merchantId,
      amount_cents: input.amountCents,
      currency: 'MXN',
      concept: input.concept,
      items: input.items,
      status: 'CREATING',
      idempotency_key: input.idempotencyKey,
      request_hash: input.requestHash,
      pey_reference: null,
      pey_transaction_id: null,
      qr_payload: null,
      expires_at: input.expiresAt,
      paid_at: null,
      paid_after_expiry: false,
      failure_reason: null,
      last_checked_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.charges.set(row.id, row);
    return { ...row };
  }

  async getChargeById(chargeId: string): Promise<ChargeRow | null> {
    const row = this.charges.get(chargeId);
    return row ? { ...row } : null;
  }

  async findChargeByPeyReference(peyReference: string): Promise<ChargeRow | null> {
    for (const c of this.charges.values()) {
      if (c.pey_reference === peyReference) {
        return { ...c };
      }
    }
    return null;
  }

  async claimCheckTurn(chargeId: string, minAgeSeconds: number): Promise<ChargeRow | null> {
    const row = this.charges.get(chargeId);
    if (!row) return null;
    if (!['AWAITING_PAYMENT', 'CREATING', 'EXPIRED', 'CANCELLED'].includes(row.status)) {
      return null;
    }
    const nowMs = Date.now();
    if (row.last_checked_at) {
      const ageMs = nowMs - new Date(row.last_checked_at).getTime();
      if (ageMs < minAgeSeconds * 1000) {
        return null;
      }
    }
    row.last_checked_at = new Date(nowMs).toISOString();
    row.updated_at = row.last_checked_at;
    return { ...row };
  }

  async applyTransition(params: {
    chargeId: string;
    to: ChargeStatus;
    peyReference?: string | null;
    peyTransactionId?: string | null;
    qrPayload?: string | null;
    paidAt?: string | null;
    failureReason?: string | null;
  }): Promise<ChargeRow> {
    const row = this.charges.get(params.chargeId);
    if (!row) {
      throw new Error(`Charge not found: ${params.chargeId}`);
    }

    const allowedFrom = ALLOWED_TRANSITIONS[params.to] ?? [];
    if (!allowedFrom.includes(row.status)) {
      return { ...row };
    }

    const wasExpiredOrCancelled = row.status === 'EXPIRED' || row.status === 'CANCELLED';
    const isPastExpiresAt = Date.now() > new Date(row.expires_at).getTime();

    row.status = params.to;
    row.pey_reference = params.peyReference ?? row.pey_reference;
    row.pey_transaction_id = params.peyTransactionId ?? row.pey_transaction_id;
    row.qr_payload = params.qrPayload ?? row.qr_payload;
    if (params.to === 'CONFIRMED') {
      this.transitionCallsToConfirmed += 1;
      row.paid_at = params.paidAt ?? new Date().toISOString();
      if (wasExpiredOrCancelled || isPastExpiresAt) {
        row.paid_after_expiry = true;
      }
    }
    row.failure_reason = params.failureReason ?? row.failure_reason;
    row.updated_at = new Date().toISOString();

    return { ...row };
  }

  async insertWebhookEvent(input: {
    webhookId: string;
    type: string | null;
    payload: unknown;
  }): Promise<{ inserted: boolean; eventId: string | null }> {
    if (this.webhookEvents.has(input.webhookId)) {
      return { inserted: false, eventId: null };
    }
    const id = crypto.randomUUID();
    this.webhookEvents.set(input.webhookId, {
      id,
      webhook_id: input.webhookId,
      type: input.type,
      payload: input.payload,
      received_at: new Date().toISOString(),
      processed_at: null,
      error: null,
    });
    return { inserted: true, eventId: id };
  }

  async markWebhookProcessed(webhookId: string, error?: string | null): Promise<void> {
    const ev = this.webhookEvents.get(webhookId);
    if (!ev) return;
    ev.processed_at = error ? null : new Date().toISOString();
    ev.error = error ?? null;
  }

  async listChargesForReconciliation(limit: number): Promise<ChargeRow[]> {
    return Array.from(this.charges.values())
      .filter((c) => c.status === 'CREATING' || c.status === 'AWAITING_PAYMENT')
      .slice(0, limit)
      .map((c) => ({ ...c }));
  }
}
