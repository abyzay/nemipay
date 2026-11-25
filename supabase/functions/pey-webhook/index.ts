import { errorResponse, jsonResponse, logStructured } from '../_shared/errors.ts';
import { RealPeyAdapter, type PeyAdapter, type VerifiedPeyWebhook } from '../_shared/pey.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface PeyWebhookDeps {
  repo: EdgeRepository;
  pey: PeyAdapter;
}

export function createPeyWebhookHandler(deps: PeyWebhookDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
      return errorResponse(req, 405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
    }

    // Leer el cuerpo crudo ANTES de parsear JSON (la firma HMAC usa el texto exacto).
    const rawBody = await req.text();

    let verified: VerifiedPeyWebhook;
    try {
      verified = await deps.pey.verifyWebhook(rawBody, req.headers);
    } catch (error) {
      logStructured('warn', 'webhook.invalid_signature', {
        webhookId: req.headers.get('webhook-id') ?? null,
        reason: error instanceof Error ? error.message : 'invalid',
      });
      return errorResponse(req, 401, 'INVALID_SIGNATURE', 'Firma de webhook inválida.');
    }

    const { inserted } = await deps.repo.insertWebhookEvent({
      webhookId: verified.webhookId,
      type: verified.type,
      payload: verified.rawPayload,
    });

    if (!inserted) {
      return jsonResponse(req, 200, { received: true, deduplicated: true });
    }

    try {
      if (verified.type !== 'codi.qr.payment_received') {
        logStructured('info', 'webhook.ignored_event_type', {
          webhookId: verified.webhookId,
          type: verified.type,
        });
        await deps.repo.markWebhookProcessed(verified.webhookId, null);
        return jsonResponse(req, 200, { received: true, ignored: true });
      }

      let charge = verified.chargeId ? await deps.repo.getChargeById(verified.chargeId) : null;
      if (!charge && verified.peyReference) {
        charge = await deps.repo.findChargeByPeyReference(verified.peyReference);
      }

      if (!charge) {
        logStructured('warn', 'webhook.charge_not_found', {
          webhookId: verified.webhookId,
          chargeId: verified.chargeId,
          peyReference: verified.peyReference,
        });
        await deps.repo.markWebhookProcessed(verified.webhookId, 'CHARGE_NOT_FOUND');
        return jsonResponse(req, 200, { received: true, matched: false });
      }

      if (verified.amountCents === null || verified.amountCents !== charge.amount_cents) {
        logStructured('warn', 'webhook.amount_mismatch', {
          webhookId: verified.webhookId,
          chargeId: charge.id,
          expectedCents: charge.amount_cents,
          receivedCents: verified.amountCents,
        });
        await deps.repo.applyTransition({
          chargeId: charge.id,
          to: 'UNDER_REVIEW',
          peyReference: verified.peyReference ?? charge.pey_reference,
          peyTransactionId: verified.transactionId,
          failureReason: 'AMOUNT_MISMATCH',
        });
        await deps.repo.markWebhookProcessed(verified.webhookId, null);
        return jsonResponse(req, 200, { received: true, status: 'UNDER_REVIEW' });
      }

      const updated = await deps.repo.applyTransition({
        chargeId: charge.id,
        to: 'CONFIRMED',
        peyReference: verified.peyReference ?? charge.pey_reference,
        peyTransactionId: verified.transactionId,
        paidAt: verified.paidAt,
      });

      await deps.repo.markWebhookProcessed(verified.webhookId, null);
      logStructured('info', 'webhook.charge_confirmed', {
        webhookId: verified.webhookId,
        chargeId: updated.id,
        paidAfterExpiry: updated.paid_after_expiry,
      });

      return jsonResponse(req, 200, { received: true, status: updated.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
      await deps.repo.markWebhookProcessed(verified.webhookId, message);
      logStructured('error', 'webhook.processing_failed', {
        webhookId: verified.webhookId,
        error: message,
      });
      return errorResponse(req, 500, 'WEBHOOK_PROCESSING_FAILED', 'Error procesando webhook.');
    }
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createPeyWebhookHandler({
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
