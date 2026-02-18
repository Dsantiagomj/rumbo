import { z } from 'zod';
import { currencySchema } from './enums';

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  targetDate: z.coerce.date().nullable().optional(),
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export type CreateSavingsGoal = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>;
