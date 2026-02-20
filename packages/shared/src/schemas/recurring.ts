import { z } from 'zod';
import { amountTypeSchema, currencySchema, frequencySchema, reminderChannelSchema } from './enums';

export const createRecurringExpenseSchema = z.object({
  productId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  amountType: amountTypeSchema,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  dueDay: z.number().int().min(1).max(31),
  frequency: frequencySchema,
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();

export const createReminderSchema = z.object({
  recurringExpenseId: z.string().uuid(),
  daysBefore: z.number().int().min(0).max(30),
  channel: reminderChannelSchema,
});

export const updateReminderSchema = createReminderSchema
  .partial()
  .omit({ recurringExpenseId: true });

export type CreateRecurringExpense = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpense = z.infer<typeof updateRecurringExpenseSchema>;
export type CreateReminder = z.infer<typeof createReminderSchema>;
export type UpdateReminder = z.infer<typeof updateReminderSchema>;
