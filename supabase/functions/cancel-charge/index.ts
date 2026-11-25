import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { chargeIdBodySchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  toChargeDto,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CancelChargeDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
}

export function createCancelChargeHandler(deps: CancelChargeDeps) {
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

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return errorResponse(req, 400, 'INVALID_JSON', 'Cuerpo JSON inválido.');
    }

    const parsed = chargeIdBodySchema.safeParse(rawJson);
    if (!parsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'chargeId inválido.');
    }

    const charge = await deps.repo.getChargeById(parsed.data.chargeId);
    if (!charge || charge.merchant_id !== user.userId) {
      return errorResponse(req, 404, 'CHARGE_NOT_FOUND', 'Cobro no encontrado.');
    }

    const updated = await deps.repo.applyTransition({
      chargeId: charge.id,
      to: 'CANCELLED',
    });

    return jsonResponse(req, 200, toChargeDto(updated));
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createCancelChargeHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
  });
  Deno.serve(handler);
}
