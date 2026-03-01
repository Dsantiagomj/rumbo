import { z } from 'zod';
import { currencySchema } from './enums';
import { transactionResponseSchema } from './transaction';

export const createTransferBaseSchema = z.object({
  sourceProductId: z.string().uuid(),
  destinationProductId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  date: z.coerce.date(),
  notes: z.string().max(500).nullable().optional(),
  exchangeRate: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Invalid rate format')
    .optional(),
});

export const createTransferSchema = createTransferBaseSchema.refine(
  (data) => data.sourceProductId !== data.destinationProductId,
  {
    message: 'Source and destination must be different',
    path: ['destinationProductId'],
  },
);

export const createTransferResponseSchema = z.object({
  transferId: z.string().uuid(),
  sourceTransaction: transactionResponseSchema,
  destinationTransaction: transactionResponseSchema,
  exchangeRate: z.string().nullable(),
});

export const trmRateResponseSchema = z.object({
  rate: z.string(),
  date: z.string(),
  source: z.string(),
});

export type CreateTransfer = z.infer<typeof createTransferSchema>;
export type CreateTransferResponse = z.infer<typeof createTransferResponseSchema>;
export type TrmRateResponse = z.infer<typeof trmRateResponseSchema>;
