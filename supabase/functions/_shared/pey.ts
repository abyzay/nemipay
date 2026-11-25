import { centsToPesosNumber, pesosToCents, timingSafeEqualStrings } from './money.ts';
import {
  peyCreateQrResponseSchema,
  peyTransactionItemSchema,
  peyWebhookPayloadSchema,
} from './schemas.ts';

export interface CreateQrChargeInput {
  chargeId: string;
  amountCents: number;
  concept: string;
  expiresAt: string;
}

export interface CreateQrChargeResult {
  peyReference: string;
  qrPayload: string;
}

export interface PeyTransactionStatusResult {
  status: 'PENDING' | 'PAID';
  peyReference: string;
  transactionId: string | null;
  amountCents: number | null;
  paidAt: string | null;
}

export interface VerifiedPeyWebhook {
  webhookId: string;
  type: string;
  chargeId: string | null;
  peyReference: string | null;
  transactionId: string | null;
  amountCents: number | null;
  paidAt: string | null;
  rawPayload: Record<string, unknown>;
}

export class PeyHttpError extends Error {
  readonly status: number;
  readonly isRetryable: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PeyHttpError';
    this.status = status;
    this.isRetryable = status >= 500 || status === 429 || status === 408;
  }
}

export interface PeyAdapter {
  createQrCharge(input: CreateQrChargeInput): Promise<CreateQrChargeResult>;
  getTransaction(peyReference: string): Promise<PeyTransactionStatusResult>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPeyWebhook>;
}

const WEBHOOK_TOLERANCE_SECONDS = 300;

function decodeBase64Bytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64Bytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeStandardWebhookSecret(secret: string): Uint8Array<ArrayBuffer> {
  const trimmed = secret.trim();
  const rawBase64 = trimmed.startsWith('whsec_') ? trimmed.slice('whsec_'.length) : trimmed;
  return decodeBase64Bytes(rawBase64);
}

export async function signStandardWebhook(
  secret: string,
  webhookId: string,
  timestampSeconds: number,
  rawBody: string
): Promise<string> {
  const keyBytes = decodeStandardWebhookSecret(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedContent = `${webhookId}.${timestampSeconds}.${rawBody}`;
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signedContent)
  );
  return `v1,${encodeBase64Bytes(new Uint8Array(sigBuffer))}`;
}

export async function verifyStandardWebhookSignature(
  secret: string,
  rawBody: string,
  headers: Headers,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
): Promise<{ webhookId: string; timestampSeconds: number }> {
  const webhookId = headers.get('webhook-id')?.trim();
  const timestampRaw = headers.get('webhook-timestamp')?.trim();
  const signatureHeader = headers.get('webhook-signature')?.trim();

  if (!webhookId || !timestampRaw || !signatureHeader) {
    throw new Error('Faltan headers obligatorios de Standard Webhooks.');
  }

  if (!/^\d+$/.test(timestampRaw)) {
    throw new Error('webhook-timestamp inválido.');
  }

  const timestampSeconds = Number.parseInt(timestampRaw, 10);
  if (Math.abs(nowEpochSeconds - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error('webhook-timestamp fuera de la ventana de tolerancia de 5 minutos.');
  }

  const expectedSignature = await signStandardWebhook(secret, webhookId, timestampSeconds, rawBody);
  const expectedToken = expectedSignature.slice('v1,'.length);

  const candidates = signatureHeader.split(/\s+/).filter(Boolean);
  for (const candidate of candidates) {
    const [version, sig] = candidate.split(',', 2);
    if (version === 'v1' && sig && timingSafeEqualStrings(sig, expectedToken)) {
      return { webhookId, timestampSeconds };
    }
  }

  throw new Error('Firma de webhook inválida.');
}

export class RealPeyAdapter implements PeyAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(config?: { baseUrl?: string; apiKey?: string; webhookSecret?: string }) {
    this.baseUrl = (
      config?.baseUrl ??
      Deno.env.get('PEY_BASE_URL') ??
      'https://api.pey.mx'
    ).replace(/\/+$/, '');
    this.apiKey = config?.apiKey ?? Deno.env.get('PEY_API_KEY') ?? '';
    this.webhookSecret = config?.webhookSecret ?? Deno.env.get('PEY_WEBHOOK_SECRET') ?? '';
  }

  async createQrCharge(input: CreateQrChargeInput): Promise<CreateQrChargeResult> {
    if (!this.apiKey) {
      throw new Error('Falta PEY_API_KEY.');
    }

    const ttlSeconds = Math.max(
      360,
      Math.floor((new Date(input.expiresAt).getTime() - Date.now()) / 1000)
    );

    // En `POST /codi/qr`, `metadata` acepta pares clave-valor planos (sin objetos anidados);
    // Pey los devuelve anidados bajo `metadata.externalMetadata` en el webhook.
    const body = {
      amount: centsToPesosNumber(input.amountCents),
      concept: input.concept,
      expiration: ttlSeconds,
      metadata: {
        chargeId: input.chargeId,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(`${this.baseUrl}/codi/qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new PeyHttpError(
          response.status,
          `Pey respondió HTTP ${response.status} al crear QR CoDi.`
        );
      }

      const parsedJson = JSON.parse(rawText) as unknown;
      // VERIFY: Confirmar en respuesta real de `POST /codi/qr` si `qr` es la cadena CoDi
      // para codificar en QR o una imagen data-URI/base64, y si el campo se llama exactamente `codiQrId`.
      const parsed = peyCreateQrResponseSchema.parse(parsedJson);

      return {
        peyReference: parsed.codiQrId,
        qrPayload: parsed.qr,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async getTransaction(peyReference: string): Promise<PeyTransactionStatusResult> {
    if (!this.apiKey) {
      throw new Error('Falta PEY_API_KEY.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      // VERIFY: Confirmar en docs.pey.mx el wrapper exacto de `GET /transaction/codi/qr/:id`
      // (si devuelve arreglo directo `[...]`, `{ data: [...] }`, `{ transactions: [...] }` u objeto único).
      // También verificar en docs.pey.mx si existe un endpoint de búsqueda por `externalMetadata.chargeId`
      // para reconciliar cobros que quedaron en `CREATING` sin `pey_reference`.
      const response = await fetch(
        `${this.baseUrl}/transaction/codi/qr/${encodeURIComponent(peyReference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new PeyHttpError(
          response.status,
          `Pey respondió HTTP ${response.status} al consultar transacción.`
        );
      }

      const json = (await response.json()) as unknown;
      const record =
        typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : null;
      const list = Array.isArray(json)
        ? json
        : record && Array.isArray(record.items)
          ? (record.items as unknown[])
          : record && Array.isArray(record.data)
            ? (record.data as unknown[])
            : record && Array.isArray(record.transactions)
              ? (record.transactions as unknown[])
              : [json];

      for (const entry of list) {
        const parsed = peyTransactionItemSchema.safeParse(entry);
        if (parsed.success && parsed.data.status === 'PAID') {
          return {
            status: 'PAID',
            peyReference,
            transactionId: parsed.data.id,
            // VERIFY: Confirmar que `amount` en GET /transaction/codi/qr/:id viene en pesos MXN.
            amountCents: pesosToCents(parsed.data.amount),
            paidAt: parsed.data.datePaid
              ? new Date(parsed.data.datePaid * 1000).toISOString()
              : new Date().toISOString(),
          };
        }
      }

      return {
        status: 'PENDING',
        peyReference,
        transactionId: null,
        amountCents: null,
        paidAt: null,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPeyWebhook> {
    if (!this.webhookSecret) {
      throw new Error('Falta PEY_WEBHOOK_SECRET.');
    }

    const { webhookId } = await verifyStandardWebhookSignature(
      this.webhookSecret,
      rawBody,
      headers
    );

    const parsedJson = JSON.parse(rawBody) as Record<string, unknown>;
    const parsed = peyWebhookPayloadSchema.parse(parsedJson);

    // VERIFY: Confirmar en el payload real de $0.01 si `amount` viene en pesos MXN (ej. 0.01 o 150)
    // y si `datePaid` viene en segundos Unix.
    const amountCents = parsed.amount !== undefined ? pesosToCents(parsed.amount) : null;
    const paidAt =
      parsed.datePaid !== undefined ? new Date(parsed.datePaid * 1000).toISOString() : null;

    return {
      webhookId,
      type: parsed.type,
      chargeId: parsed.metadata?.externalMetadata?.chargeId ?? null,
      peyReference: parsed.codiQrId ?? null,
      transactionId: parsed.transactionId ?? null,
      amountCents,
      paidAt,
      rawPayload: parsedJson,
    };
  }
}
