import { z } from 'zod';
import { currencySchema, transactionTypeSchema } from './enums';

export const createTransactionSchema = z.object({
  productId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: transactionTypeSchema,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  date: z.coerce.date(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
