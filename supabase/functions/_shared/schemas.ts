import { z } from 'npm:zod@3.24.2';

export const uuidSchema = z.string().uuid();

export const createChargeItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const createChargeFreeAmountSchema = z.object({
  amountCents: z.number().int().min(100),
  concept: z.string().trim().min(1).max(60).optional(),
  items: z.undefined().optional(),
});

export const createChargeItemsSchema = z.object({
  items: z.array(createChargeItemSchema).min(1).max(50),
  amountCents: z.undefined().optional(),
  concept: z.undefined().optional(),
});

export const createChargeBodySchema = z.union([
  createChargeFreeAmountSchema.strict(),
  createChargeItemsSchema.strict(),
]);

export const chargeIdBodySchema = z.object({
  chargeId: z.string().uuid(),
});

export const peyCreateQrResponseSchema = z
  .union([
    z.object({
      id: z.string().min(1),
      qrString: z.string().min(1),
    }),
    z.object({
      codiQrId: z.string().min(1),
      qr: z.string().min(1),
    }),
  ])
  .transform((data) =>
    'id' in data
      ? { codiQrId: data.id, qr: data.qrString }
      : { codiQrId: data.codiQrId, qr: data.qr }
  );

export const peyTransactionItemSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['PENDING', 'PAID']),
  amount: z.union([z.number(), z.string()]),
  datePaid: z.number().int().optional(),
});

export const peyWebhookPayloadSchema = z.object({
  type: z.string().min(1),
  amount: z.union([z.number(), z.string()]).optional(),
  codiQrId: z.string().min(1).optional(),
  transactionId: z.string().min(1).optional(),
  datePaid: z.number().int().optional(),
  metadata: z
    .object({
      externalMetadata: z
        .object({
          chargeId: z.string().uuid().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
});
