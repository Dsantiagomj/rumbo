import { z } from 'zod';
import { currencySchema, transactionTypeSchema } from './enums';

export const createTransactionSchema = z.object({
  productId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: transactionTypeSchema,
  name: z.string().min(1).max(200),
  merchant: z.string().max(200).nullable().optional(),
  excluded: z.boolean().optional().default(false),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  date: z.coerce.date(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  transferId: z.string().uuid().nullable(),
  type: transactionTypeSchema,
  name: z.string(),
  merchant: z.string().nullable(),
  excluded: z.boolean(),
  amount: z.string(),
  currency: currencySchema,
  date: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const transactionListResponseSchema = z.object({
  transactions: z.array(transactionResponseSchema),
  nextCursor: z.string().nullable(),
});

export const balanceHistoryPointSchema = z.object({
  date: z.string(),
  balance: z.string(),
});

export const balanceHistoryResponseSchema = z.object({
  history: z.array(balanceHistoryPointSchema),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
export type BalanceHistoryPoint = z.infer<typeof balanceHistoryPointSchema>;
export type BalanceHistoryResponse = z.infer<typeof balanceHistoryResponseSchema>;
