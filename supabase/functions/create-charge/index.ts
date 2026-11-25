import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, logStructured } from '../_shared/errors.ts';
import { sha256Hex } from '../_shared/money.ts';
import { PeyHttpError, RealPeyAdapter, type PeyAdapter } from '../_shared/pey.ts';
import { createChargeBodySchema, uuidSchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  toChargeDto,
  type ChargeItemSnapshot,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CreateChargeDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
  pey: PeyAdapter;
  getMaxChargeCents?: () => number;
  getChargeTtlSeconds?: () => number;
  getRateLimitPerMinute?: () => number;
}

function buildItemsConcept(items: ChargeItemSnapshot[]): string {
  const joined = items.map((item) => `${item.quantity}× ${item.name}`).join(', ');
  if (joined.length <= 60) {
    return joined;
  }
  return `${joined.slice(0, 59)}…`;
}

export function createChargeHandler(deps: CreateChargeDeps) {
  return async (req: Request): Promise<Response> => {
    const preflight = handleCorsPreflight(req);
    if (preflight) return preflight;

    if (req.method !== 'POST') {
      return errorResponse(req, 405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
    }

    const user = await deps.authenticate(req);
    if (!user) {
      return errorResponse(req, 401, 'UNAUTHORIZED', 'Sesión requerida.');
    }

    const rawIdempotencyKey = req.headers.get('idempotency-key')?.trim() ?? '';
    const keyParsed = uuidSchema.safeParse(rawIdempotencyKey);
    if (!keyParsed.success) {
      return errorResponse(
        req,
        400,
        'INVALID_IDEMPOTENCY_KEY',
        'El header Idempotency-Key debe ser un UUID válido.'
      );
    }
    const idempotencyKey = keyParsed.data;

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return errorResponse(req, 400, 'INVALID_JSON', 'Cuerpo JSON inválido.');
    }

    const bodyParsed = createChargeBodySchema.safeParse(rawJson);
    if (!bodyParsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'Datos de cobro inválidos.', {
        issues: bodyParsed.error.issues,
      });
    }

    const maxChargeCents =
      deps.getMaxChargeCents?.() ??
      (Number.parseInt(Deno.env.get('MAX_CHARGE_CENTS') ?? '9999900', 10) || 9999900);
    const ttlSeconds =
      deps.getChargeTtlSeconds?.() ??
      (Number.parseInt(Deno.env.get('CHARGE_TTL_SECONDS') ?? '600', 10) || 600);
    const rateLimitPerMinute = deps.getRateLimitPerMinute?.() ?? 30;

    const payload = bodyParsed.data;
    const canonicalBody =
      'items' in payload && payload.items
        ? {
            mode: 'items',
            items: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }
        : {
            mode: 'free',
            amountCents: payload.amountCents,
            concept: (payload.concept ?? 'Cobro NemiPay').trim(),
          };
    const requestHash = await sha256Hex(JSON.stringify(canonicalBody));

    const existing = await deps.repo.findChargeByIdempotencyKey(user.userId, idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) {
        return errorResponse(
          req,
          409,
          'IDEMPOTENCY_CONFLICT',
          'La llave de idempotencia ya fue usada con datos distintos.'
        );
      }
      return jsonResponse(req, 200, toChargeDto(existing));
    }

    const oneMinuteAgoIso = new Date(Date.now() - 60_000).toISOString();
    const recentCount = await deps.repo.countRecentCharges(user.userId, oneMinuteAgoIso);
    if (recentCount >= rateLimitPerMinute) {
      return errorResponse(
        req,
        429,
        'RATE_LIMITED',
        'Demasiados cobros en el último minuto. Espera unos segundos.'
      );
    }

    let amountCents: number;
    let concept: string;
    let itemsSnapshot: ChargeItemSnapshot[] | null = null;

    if ('items' in payload && payload.items) {
      const aggregatedQuantities = new Map<string, number>();
      for (const line of payload.items) {
        aggregatedQuantities.set(
          line.productId,
          (aggregatedQuantities.get(line.productId) ?? 0) + line.quantity
        );
      }

      const uniqueIds = Array.from(aggregatedQuantities.keys());
      const activeProducts = await deps.repo.findActiveProductsByIds(user.userId, uniqueIds);
      const productsMap = new Map(activeProducts.map((p) => [p.id, p]));

      const snapshot: ChargeItemSnapshot[] = [];
      let totalCents = 0;
      for (const productId of uniqueIds) {
        const product = productsMap.get(productId);
        if (!product) {
          return errorResponse(
            req,
            400,
            'INVALID_PRODUCT',
            'Uno o más productos no existen, no están activos o no pertenecen al comercio.'
          );
        }
        const quantity = aggregatedQuantities.get(productId) ?? 0;
        if (quantity < 1 || quantity > 99) {
          return errorResponse(
            req,
            400,
            'INVALID_QUANTITY',
            'La cantidad por producto debe estar entre 1 y 99.'
          );
        }
        totalCents += product.price_cents * quantity;
        snapshot.push({
          productId: product.id,
          name: product.name,
          priceCents: product.price_cents,
          quantity,
        });
      }

      if (totalCents < 100 || totalCents > maxChargeCents) {
        return errorResponse(
          req,
          400,
          'AMOUNT_OUT_OF_RANGE',
          `El monto total debe estar entre $1.00 y $${(maxChargeCents / 100).toFixed(2)} MXN.`
        );
      }

      amountCents = totalCents;
      itemsSnapshot = snapshot;
      concept = buildItemsConcept(snapshot);
    } else {
      const freeAmount = payload.amountCents!;
      if (freeAmount < 100 || freeAmount > maxChargeCents) {
        return errorResponse(
          req,
          400,
          'AMOUNT_OUT_OF_RANGE',
          `El monto debe estar entre $1.00 y $${(maxChargeCents / 100).toFixed(2)} MXN.`
        );
      }
      amountCents = freeAmount;
      concept = (payload.concept ?? 'Cobro NemiPay').trim();
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    let createdCharge;
    try {
      createdCharge = await deps.repo.insertCreatingCharge({
        merchantId: user.userId,
        amountCents,
        concept,
        items: itemsSnapshot,
        idempotencyKey,
        requestHash,
        expiresAt,
      });
    } catch (err) {
      // Posible carrera concurrente con la misma idempotency_key
      const raceExisting = await deps.repo.findChargeByIdempotencyKey(user.userId, idempotencyKey);
      if (raceExisting) {
        if (raceExisting.request_hash !== requestHash) {
          return errorResponse(
            req,
            409,
            'IDEMPOTENCY_CONFLICT',
            'La llave de idempotencia ya fue usada con datos distintos.'
          );
        }
        return jsonResponse(req, 200, toChargeDto(raceExisting));
      }
      throw err;
    }

    try {
      const qrResult = await deps.pey.createQrCharge({
        chargeId: createdCharge.id,
        amountCents,
        concept,
        expiresAt,
      });

      const updated = await deps.repo.applyTransition({
        chargeId: createdCharge.id,
        to: 'AWAITING_PAYMENT',
        peyReference: qrResult.peyReference,
        qrPayload: qrResult.qrPayload,
      });

      logStructured('info', 'charge.created', {
        chargeId: updated.id,
        merchantId: user.userId,
        amountCents,
      });

      return jsonResponse(req, 201, toChargeDto(updated));
    } catch (error) {
      if (error instanceof PeyHttpError && !error.isRetryable) {
        await deps.repo.applyTransition({
          chargeId: createdCharge.id,
          to: 'FAILED',
          failureReason: `PEY_HTTP_${error.status}`,
        });
        logStructured('warn', 'charge.pey_rejected', {
          chargeId: createdCharge.id,
          status: error.status,
        });
        return errorResponse(req, 502, 'PEY_REJECTED', 'No se pudo generar el QR CoDi en Pey.', {
          chargeId: createdCharge.id,
        });
      }

      // Error incierto (timeout / 5xx): dejamos en CREATING para que reconciliación decida
      logStructured('warn', 'charge.pey_uncertain', {
        chargeId: createdCharge.id,
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return errorResponse(
        req,
        502,
        'PEY_UNCERTAIN',
        'La creación del QR quedó pendiente de confirmación. Verifica en unos segundos.',
        { chargeId: createdCharge.id }
      );
    }
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createChargeHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
