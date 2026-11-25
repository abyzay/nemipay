import {
  type CreateQrChargeInput,
  type CreateQrChargeResult,
  type PeyAdapter,
  PeyHttpError,
  type PeyTransactionStatusResult,
  type VerifiedPeyWebhook,
  verifyStandardWebhookSignature,
} from './pey.ts';
import { pesosToCents } from './money.ts';
import { peyWebhookPayloadSchema } from './schemas.ts';

/**
 * Adaptador falso EXCLUSIVO para pruebas automatizadas.
 * Prohibido en producción: falla inmediatamente si APP_ENV=production.
 */
export class FakePeyAdapter implements PeyAdapter {
  readonly webhookSecret: string;
  readonly transactions = new Map<string, PeyTransactionStatusResult>();
  public failNextCreateWithStatus: number | null = null;
  public createCalls = 0;
  public getCalls = 0;

  constructor(webhookSecret = 'whsec_dGVzdC1zZWNyZXQtMzItYnl0ZXMtbG9uZy0xMjM0NTY=') {
    if (Deno.env.get('APP_ENV') === 'production') {
      throw new Error('FakePeyAdapter no puede cargarse cuando APP_ENV=production.');
    }
    this.webhookSecret = webhookSecret;
  }

  async createQrCharge(input: CreateQrChargeInput): Promise<CreateQrChargeResult> {
    if (Deno.env.get('APP_ENV') === 'production') {
      throw new Error('FakePeyAdapter prohibido en producción.');
    }
    this.createCalls += 1;

    if (this.failNextCreateWithStatus !== null) {
      const status = this.failNextCreateWithStatus;
      this.failNextCreateWithStatus = null;
      throw new PeyHttpError(status, `Fallo simulado de Pey (${status})`);
    }

    const peyReference = `fake-qr-${input.chargeId.slice(0, 8)}`;
    this.transactions.set(peyReference, {
      status: 'PENDING',
      peyReference,
      transactionId: null,
      amountCents: input.amountCents,
      paidAt: null,
    });

    return {
      peyReference,
      qrPayload: `CODI://FAKE/${peyReference}/${input.amountCents}`,
    };
  }

  async getTransaction(peyReference: string): Promise<PeyTransactionStatusResult> {
    this.getCalls += 1;
    return (
      this.transactions.get(peyReference) ?? {
        status: 'PENDING',
        peyReference,
        transactionId: null,
        amountCents: null,
        paidAt: null,
      }
    );
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPeyWebhook> {
    const { webhookId } = await verifyStandardWebhookSignature(
      this.webhookSecret,
      rawBody,
      headers
    );
    const parsedJson = JSON.parse(rawBody) as Record<string, unknown>;
    const parsed = peyWebhookPayloadSchema.parse(parsedJson);

    return {
      webhookId,
      type: parsed.type,
      chargeId: parsed.metadata?.externalMetadata?.chargeId ?? null,
      peyReference: parsed.codiQrId ?? null,
      transactionId: parsed.transactionId ?? null,
      amountCents: parsed.amount !== undefined ? pesosToCents(parsed.amount) : null,
      paidAt: parsed.datePaid !== undefined ? new Date(parsed.datePaid * 1000).toISOString() : null,
      rawPayload: parsedJson,
    };
  }
}
