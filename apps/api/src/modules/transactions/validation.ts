import { z } from '@hono/zod-openapi';
import {
  balanceHistoryResponseSchema,
  createTransactionSchema,
  transactionListResponseSchema,
  transactionResponseSchema,
  updateTransactionSchema,
} from '@rumbo/shared/schemas';

export const createTransactionBodySchema = createTransactionSchema
  .omit({ productId: true })
  .openapi('CreateTransaction');

export const updateTransactionBodySchema = updateTransactionSchema
  .omit({ productId: true })
  .openapi('UpdateTransaction');

export const transactionResponse = transactionResponseSchema.openapi('Transaction');
export const transactionListResponse = transactionListResponseSchema.openapi('TransactionList');

export const productIdParamSchema = z.object({
  productId: z.string().uuid().openapi({
    description: 'Financial Product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
});

export const transactionIdParamSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
});

export const balanceHistoryResponse = balanceHistoryResponseSchema.openapi('BalanceHistory');

export const balanceHistoryQuerySchema = z.object({
  currency: z.string().openapi({ description: 'Currency code (COP, USD)', example: 'COP' }),
});

export const transactionQuerySchema = z.object({
  search: z.string().optional().openapi({ description: 'Text search' }),
  start_date: z.string().optional().openapi({ description: 'Start date (ISO format)' }),
  end_date: z.string().optional().openapi({ description: 'End date (ISO format)' }),
  types: z.string().optional().openapi({ description: 'Comma-separated transaction types' }),
  categories: z.string().optional().openapi({ description: 'Comma-separated category UUIDs' }),
  amount_min: z.string().optional().openapi({ description: 'Minimum amount' }),
  amount_max: z.string().optional().openapi({ description: 'Maximum amount' }),
  cursor: z.string().optional().openapi({ description: 'Pagination cursor' }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25)
    .optional()
    .openapi({ description: 'Page size (1-100, default 25)' }),
});
