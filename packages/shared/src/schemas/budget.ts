import { z } from 'zod';
import { budgetPeriodSchema, currencySchema } from './enums';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  period: budgetPeriodSchema,
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudget = z.infer<typeof createBudgetSchema>;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;
