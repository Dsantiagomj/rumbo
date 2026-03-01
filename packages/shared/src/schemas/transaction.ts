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

// Global transaction response — includes product context
export const globalTransactionResponseSchema = transactionResponseSchema.extend({
  productName: z.string(),
  productType: z.string(),
});

export const globalTransactionListResponseSchema = z.object({
  transactions: z.array(globalTransactionResponseSchema),
  nextCursor: z.string().nullable(),
});

// Bulk delete
export const bulkDeleteTransactionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const bulkDeleteFailedItemSchema = z.object({
  id: z.string().uuid(),
  reason: z.string(),
});

export const bulkDeleteTransactionsResponseSchema = z.object({
  deleted: z.number().int().min(0),
  failed: z.array(bulkDeleteFailedItemSchema),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
export type GlobalTransactionResponse = z.infer<typeof globalTransactionResponseSchema>;
export type GlobalTransactionListResponse = z.infer<typeof globalTransactionListResponseSchema>;
export type BalanceHistoryPoint = z.infer<typeof balanceHistoryPointSchema>;
export type BalanceHistoryResponse = z.infer<typeof balanceHistoryResponseSchema>;
export type BulkDeleteTransactions = z.infer<typeof bulkDeleteTransactionsSchema>;
export type BulkDeleteTransactionsResponse = z.infer<typeof bulkDeleteTransactionsResponseSchema>;

/** Predicate: true when a transaction is the undeletable "Balance inicial" seed. */
export function isInitialBalance(tx: { name: string; categoryId: string | null }): boolean {
  return tx.name === 'Balance inicial' && tx.categoryId === null;
}
