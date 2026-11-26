import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, logStructured } from '../_shared/errors.ts';
import { billIdBodySchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CancelBillDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
}

export function createCancelBillHandler(deps: CancelBillDeps) {
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

    const parsed = billIdBodySchema.safeParse(rawJson);
    if (!parsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'billId inválido.');
    }

    try {
      const cancelled = await deps.repo.cancelBill(user.userId, parsed.data.billId);
      logStructured('info', 'bill.cancelled', {
        billId: cancelled.id,
        merchantId: user.userId,
      });
      return jsonResponse(req, 200, {
        billId: cancelled.id,
        status: cancelled.status,
        closedAt: cancelled.closed_at,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('BILL_NOT_FOUND')) {
        return errorResponse(req, 404, 'BILL_NOT_FOUND', 'No se encontró la cuenta.');
      }
      if (msg.includes('BILL_HAS_CONFIRMED_PAYMENTS')) {
        return errorResponse(
          req,
          409,
          'BILL_HAS_CONFIRMED_PAYMENTS',
          'La cuenta ya tiene pagos confirmados y no puede cancelarse.'
        );
      }
      if (msg.includes('BILL_CLOSED')) {
        return errorResponse(req, 410, 'BILL_CLOSED', 'La cuenta ya está cerrada.');
      }
      throw err;
    }
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createCancelBillHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
  });
  Deno.serve(handler);
}
