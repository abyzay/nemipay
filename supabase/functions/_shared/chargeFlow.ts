import { errorResponse, logStructured } from './errors.ts';
import { type PeyAdapter, PeyHttpError } from './pey.ts';
import type { ChargeItemSnapshot, ChargeRow, EdgeRepository } from './supabaseAdmin.ts';

export function buildItemsConcept(items: ChargeItemSnapshot[]): string {
  const joined = items.map((item) => `${item.quantity}× ${item.name}`).join(', ');
  if (joined.length <= 60) {
    return joined;
  }
  return `${joined.slice(0, 59)}…`;
}

export type ResolveOrderResult =
  | {
      ok: true;
      amountCents: number;
      concept: string;
      itemsSnapshot: ChargeItemSnapshot[] | null;
    }
  | { ok: false; response: Response };

export async function resolveOrderTotalAndConcept(params: {
  req: Request;
  repo: EdgeRepository;
  merchantId: string;
  payload:
    | { items: { productId: string; quantity: number }[] }
    | { amountCents: number; concept?: string };
  minAmountCents: number;
  maxChargeCents: number;
  defaultConcept?: string;
}): Promise<ResolveOrderResult> {
  const {
    req,
    repo,
    merchantId,
    payload,
    minAmountCents,
    maxChargeCents,
    defaultConcept = 'Cobro NemiPay',
  } = params;

  if ('items' in payload && payload.items) {
    const aggregatedQuantities = new Map<string, number>();
    for (const line of payload.items) {
      aggregatedQuantities.set(
        line.productId,
        (aggregatedQuantities.get(line.productId) ?? 0) + line.quantity
      );
    }

    const uniqueIds = Array.from(aggregatedQuantities.keys());
    const activeProducts = await repo.findActiveProductsByIds(merchantId, uniqueIds);
    const productsMap = new Map(activeProducts.map((p) => [p.id, p]));

    const snapshot: ChargeItemSnapshot[] = [];
    let totalCents = 0;
    for (const productId of uniqueIds) {
      const product = productsMap.get(productId);
      if (!product) {
        return {
          ok: false,
          response: errorResponse(
            req,
            400,
            'INVALID_PRODUCT',
            'Uno o más productos no existen, no están activos o no pertenecen al comercio.'
          ),
        };
      }
      const quantity = aggregatedQuantities.get(productId) ?? 0;
      if (quantity < 1 || quantity > 99) {
        return {
          ok: false,
          response: errorResponse(
            req,
            400,
            'INVALID_QUANTITY',
            'La cantidad por producto debe estar entre 1 y 99.'
          ),
        };
      }
      totalCents += product.price_cents * quantity;
      snapshot.push({
        productId: product.id,
        name: product.name,
        priceCents: product.price_cents,
        quantity,
      });
    }

    if (totalCents < minAmountCents || totalCents > maxChargeCents) {
      return {
        ok: false,
        response: errorResponse(
          req,
          400,
          'AMOUNT_OUT_OF_RANGE',
          `El monto total debe estar entre $${(minAmountCents / 100).toFixed(2)} y $${(maxChargeCents / 100).toFixed(2)} MXN.`
        ),
      };
    }

    return {
      ok: true,
      amountCents: totalCents,
      concept: buildItemsConcept(snapshot),
      itemsSnapshot: snapshot,
    };
  }

  const freeAmount = (payload as { amountCents: number; concept?: string }).amountCents;
  if (freeAmount < minAmountCents || freeAmount > maxChargeCents) {
    return {
      ok: false,
      response: errorResponse(
        req,
        400,
        'AMOUNT_OUT_OF_RANGE',
        `El monto debe estar entre $${(minAmountCents / 100).toFixed(2)} y $${(maxChargeCents / 100).toFixed(2)} MXN.`
      ),
    };
  }

  const concept = ((payload as { concept?: string }).concept ?? defaultConcept).trim();
  return {
    ok: true,
    amountCents: freeAmount,
    concept: concept || defaultConcept,
    itemsSnapshot: null,
  };
}

export type RequestPeyQrResult =
  | { ok: true; charge: ChargeRow }
  | { ok: false; response: Response };

export async function requestPeyQrForCharge(params: {
  req: Request;
  repo: EdgeRepository;
  pey: PeyAdapter;
  charge: ChargeRow;
  merchantId: string;
}): Promise<RequestPeyQrResult> {
  const { req, repo, pey, charge, merchantId } = params;

  try {
    const qrResult = await pey.createQrCharge({
      chargeId: charge.id,
      amountCents: charge.amount_cents,
      concept: charge.concept,
      expiresAt: charge.expires_at,
    });

    const updated = await repo.applyTransition({
      chargeId: charge.id,
      to: 'AWAITING_PAYMENT',
      peyReference: qrResult.peyReference,
      qrPayload: qrResult.qrPayload,
    });

    logStructured('info', 'charge.created', {
      chargeId: updated.id,
      merchantId,
      amountCents: updated.amount_cents,
      billId: updated.bill_id ?? undefined,
    });

    return { ok: true, charge: updated };
  } catch (error) {
    if (error instanceof PeyHttpError && !error.isRetryable) {
      await repo.applyTransition({
        chargeId: charge.id,
        to: 'FAILED',
        failureReason: `PEY_HTTP_${error.status}`,
      });
      logStructured('warn', 'charge.pey_rejected', {
        chargeId: charge.id,
        status: error.status,
      });
      return {
        ok: false,
        response: errorResponse(req, 502, 'PEY_REJECTED', 'No se pudo generar el QR CoDi en Pey.', {
          chargeId: charge.id,
        }),
      };
    }

    // Error incierto (timeout / 5xx): dejamos en CREATING para que reconciliación decida
    logStructured('warn', 'charge.pey_uncertain', {
      chargeId: charge.id,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return {
      ok: false,
      response: errorResponse(
        req,
        502,
        'PEY_UNCERTAIN',
        'La creación del QR quedó pendiente de confirmación. Verifica en unos segundos.',
        { chargeId: charge.id }
      ),
    };
  }
}
