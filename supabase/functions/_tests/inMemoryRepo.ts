import type {
  BillParticipantRow,
  BillRow,
  ChargeRow,
  ChargeStatus,
  CreateBillRpcResult,
  EdgeRepository,
  ProductRow,
  SplitMode,
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
  readonly bills = new Map<string, BillRow>();
  readonly billParticipants = new Map<string, BillParticipantRow>();
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

    if (row.bill_id) {
      this.recomputeBillSync(row.bill_id);
    }

    return { ...row };
  }

  private recomputeBillSync(billId: string): void {
    const bill = this.bills.get(billId);
    if (!bill) return;
    let collected = 0;
    for (const c of this.charges.values()) {
      if (c.bill_id === billId && c.status === 'CONFIRMED') {
        collected += c.amount_cents;
      }
    }
    const overpaid = Math.max(collected - bill.total_cents, 0);
    bill.collected_cents = collected;
    bill.overpaid_cents = overpaid;
    if (bill.status !== 'CANCELLED') {
      if (collected >= bill.total_cents) {
        bill.status = 'PAID';
        bill.closed_at = bill.closed_at ?? new Date().toISOString();
      } else if (collected > 0) {
        bill.status = 'PARTIALLY_PAID';
      } else if (bill.status !== 'EXPIRED') {
        bill.status = 'OPEN';
      }
    }
    bill.updated_at = new Date().toISOString();
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

  async createBill(input: {
    merchantId: string;
    concept: string;
    items: ChargeRow['items'];
    totalCents: number;
    splitMode: SplitMode;
    idempotencyKey: string;
    requestHash: string;
    ttlSeconds: number;
    people?: number | null;
    shares?: { label?: string; amountCents: number }[] | null;
  }): Promise<CreateBillRpcResult> {
    for (const existing of this.bills.values()) {
      if (
        existing.merchant_id === input.merchantId &&
        existing.idempotency_key === input.idempotencyKey
      ) {
        if (existing.request_hash !== input.requestHash) {
          throw new Error('IDEMPOTENCY_CONFLICT');
        }
        const participants = Array.from(this.billParticipants.values())
          .filter((p) => p.bill_id === existing.id)
          .sort((a, b) => a.position - b.position)
          .map((p) => ({ ...p }));
        return { isReplay: true, bill: { ...existing }, participants };
      }
    }

    if (input.totalCents < 200) throw new Error('INVALID_TOTAL_CENTS');
    if (input.splitMode === 'EQUAL') {
      const people = input.people ?? 0;
      if (people < 2 || people > 4) throw new Error('INVALID_PEOPLE_COUNT');
      if (Math.floor(input.totalCents / people) < 100) throw new Error('SHARE_BELOW_MINIMUM');
    } else if (input.splitMode === 'CUSTOM') {
      const shares = input.shares ?? [];
      if (shares.length < 2 || shares.length > 4) throw new Error('INVALID_CUSTOM_SHARES');
      const sum = shares.reduce((acc, s) => acc + s.amountCents, 0);
      if (shares.some((s) => s.amountCents < 100)) throw new Error('SHARE_BELOW_MINIMUM');
      if (sum !== input.totalCents) throw new Error('CUSTOM_SUM_MISMATCH');
    }

    const nowIso = new Date().toISOString();
    const bill: BillRow = {
      id: crypto.randomUUID(),
      merchant_id: input.merchantId,
      concept: input.concept,
      items: input.items,
      total_cents: input.totalCents,
      split_mode: input.splitMode,
      status: 'OPEN',
      idempotency_key: input.idempotencyKey,
      request_hash: input.requestHash,
      collected_cents: 0,
      overpaid_cents: 0,
      expires_at: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
      closed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.bills.set(bill.id, bill);

    const participants: BillParticipantRow[] = [];
    if (input.splitMode === 'EQUAL') {
      const n = input.people!;
      const base = Math.floor(input.totalCents / n);
      const rem = input.totalCents % n;
      for (let i = 1; i <= n; i += 1) {
        const p: BillParticipantRow = {
          id: crypto.randomUUID(),
          bill_id: bill.id,
          position: i,
          label: `Persona ${i}`,
          share_cents: base + (i <= rem ? 1 : 0),
          created_at: nowIso,
        };
        this.billParticipants.set(p.id, p);
        participants.push({ ...p });
      }
    } else if (input.splitMode === 'CUSTOM') {
      input.shares!.forEach((s, idx) => {
        const pos = idx + 1;
        const cleanLabel = (s.label ?? '').trim() || `Persona ${pos}`;
        const p: BillParticipantRow = {
          id: crypto.randomUUID(),
          bill_id: bill.id,
          position: pos,
          label: cleanLabel.slice(0, 20),
          share_cents: s.amountCents,
          created_at: nowIso,
        };
        this.billParticipants.set(p.id, p);
        participants.push({ ...p });
      });
    }

    return { isReplay: false, bill: { ...bill }, participants };
  }

  async reserveShare(input: {
    merchantId: string;
    billId: string;
    participantId?: string | null;
    amountCents?: number | null;
    label?: string | null;
    idempotencyKey: string;
    requestHash: string;
    ttlSeconds: number;
    maxLiveShares: number;
  }): Promise<ChargeRow> {
    const bill = this.bills.get(input.billId);
    if (!bill || bill.merchant_id !== input.merchantId) {
      throw new Error('BILL_NOT_FOUND');
    }

    const existing = await this.findChargeByIdempotencyKey(input.merchantId, input.idempotencyKey);
    if (existing) {
      if (existing.bill_id !== input.billId || existing.request_hash !== input.requestHash) {
        throw new Error('IDEMPOTENCY_CONFLICT');
      }
      return { ...existing };
    }

    if (
      (bill.status !== 'OPEN' && bill.status !== 'PARTIALLY_PAID') ||
      new Date(bill.expires_at).getTime() <= Date.now()
    ) {
      throw new Error('BILL_CLOSED');
    }

    const nowMs = Date.now();
    for (const c of this.charges.values()) {
      if (
        c.bill_id === input.billId &&
        c.status === 'AWAITING_PAYMENT' &&
        new Date(c.expires_at).getTime() <= nowMs
      ) {
        c.status = 'EXPIRED';
      }
    }

    let liveCount = 0;
    for (const c of this.charges.values()) {
      if (
        c.bill_id === input.billId &&
        (c.status === 'CREATING' || c.status === 'AWAITING_PAYMENT')
      ) {
        liveCount += 1;
      }
    }
    if (liveCount >= Math.max(1, input.maxLiveShares)) {
      throw new Error('TOO_MANY_LIVE_SHARES');
    }

    let participantId: string;
    let amountCents: number;
    let concept: string;

    if (bill.split_mode === 'EQUAL' || bill.split_mode === 'CUSTOM') {
      if (!input.participantId) throw new Error('PARTICIPANT_REQUIRED');
      const p = this.billParticipants.get(input.participantId);
      if (!p || p.bill_id !== input.billId) throw new Error('PARTICIPANT_NOT_FOUND');
      for (const c of this.charges.values()) {
        if (
          c.participant_id === p.id &&
          ['CREATING', 'AWAITING_PAYMENT', 'CONFIRMED', 'UNDER_REVIEW'].includes(c.status)
        ) {
          throw new Error('SHARE_IN_PROGRESS');
        }
      }
      participantId = p.id;
      amountCents = p.share_cents!;
      concept = `${bill.concept} · ${p.label || `Persona ${p.position}`}`.slice(0, 60);
    } else {
      if (input.participantId) throw new Error('INVALID_PARTICIPANT_FOR_FREE');
      if (!input.amountCents || input.amountCents < 100) throw new Error('INVALID_SHARE_AMOUNT');

      let confirmed = 0;
      let reserved = 0;
      for (const c of this.charges.values()) {
        if (c.bill_id !== input.billId) continue;
        if (c.status === 'CONFIRMED') confirmed += c.amount_cents;
        if (
          (c.status === 'CREATING' || c.status === 'AWAITING_PAYMENT') &&
          new Date(c.expires_at).getTime() > nowMs
        ) {
          reserved += c.amount_cents;
        }
      }
      const available = bill.total_cents - confirmed - reserved;
      if (input.amountCents > available) {
        throw new Error('AMOUNT_EXCEEDS_BALANCE');
      }

      const existingPositions = Array.from(this.billParticipants.values())
        .filter((p) => p.bill_id === input.billId)
        .map((p) => p.position);
      const nextPos = (existingPositions.length ? Math.max(...existingPositions) : 0) + 1;
      const cleanLabel = (input.label ?? '').trim() || `Aportación ${nextPos}`;
      if (cleanLabel.length > 20) throw new Error('INVALID_PARTICIPANT_LABEL');

      const newParticipant: BillParticipantRow = {
        id: crypto.randomUUID(),
        bill_id: input.billId,
        position: nextPos,
        label: cleanLabel.slice(0, 20),
        share_cents: null,
        created_at: new Date().toISOString(),
      };
      this.billParticipants.set(newParticipant.id, newParticipant);
      participantId = newParticipant.id;
      amountCents = input.amountCents;
      concept = `${bill.concept} · ${cleanLabel}`.slice(0, 60);
    }

    const nowIso = new Date().toISOString();
    const charge: ChargeRow = {
      id: crypto.randomUUID(),
      merchant_id: input.merchantId,
      amount_cents: amountCents,
      currency: 'MXN',
      concept,
      items: bill.items,
      status: 'CREATING',
      idempotency_key: input.idempotencyKey,
      request_hash: input.requestHash,
      pey_reference: null,
      pey_transaction_id: null,
      qr_payload: null,
      expires_at: new Date(Date.now() + Math.max(60, input.ttlSeconds) * 1000).toISOString(),
      paid_at: null,
      paid_after_expiry: false,
      failure_reason: null,
      last_checked_at: null,
      bill_id: input.billId,
      participant_id: participantId,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.charges.set(charge.id, charge);
    return { ...charge };
  }

  async cancelBill(merchantId: string, billId: string): Promise<BillRow> {
    const bill = this.bills.get(billId);
    if (!bill || bill.merchant_id !== merchantId) throw new Error('BILL_NOT_FOUND');

    for (const c of this.charges.values()) {
      if (c.bill_id === billId && c.status === 'CONFIRMED') {
        throw new Error('BILL_HAS_CONFIRMED_PAYMENTS');
      }
    }

    if (bill.status === 'CANCELLED') return { ...bill };
    if (bill.status === 'PAID' || bill.status === 'EXPIRED') throw new Error('BILL_CLOSED');

    for (const c of this.charges.values()) {
      if (c.bill_id === billId && (c.status === 'AWAITING_PAYMENT' || c.status === 'CREATING')) {
        c.status = c.status === 'AWAITING_PAYMENT' ? 'CANCELLED' : 'FAILED';
        c.failure_reason = c.failure_reason ?? 'BILL_CANCELLED';
      }
    }

    bill.status = 'CANCELLED';
    bill.closed_at = bill.closed_at ?? new Date().toISOString();
    bill.updated_at = new Date().toISOString();
    return { ...bill };
  }

  async expireStaleBills(): Promise<number> {
    const nowMs = Date.now();
    let count = 0;
    for (const bill of this.bills.values()) {
      if (
        (bill.status === 'OPEN' || bill.status === 'PARTIALLY_PAID') &&
        new Date(bill.expires_at).getTime() <= nowMs &&
        bill.collected_cents < bill.total_cents
      ) {
        const hasLiveCharge = Array.from(this.charges.values()).some(
          (c) => c.bill_id === bill.id && (c.status === 'CREATING' || c.status === 'AWAITING_PAYMENT')
        );
        if (!hasLiveCharge) {
          bill.status = 'EXPIRED';
          bill.closed_at = bill.closed_at ?? new Date().toISOString();
          count += 1;
        }
      }
    }
    return count;
  }
}
