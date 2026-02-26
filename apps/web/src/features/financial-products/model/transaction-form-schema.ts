import { currencySchema, transactionTypeSchema } from '@rumbo/shared';
import { z } from 'zod';

export const transactionFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  type: transactionTypeSchema,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato invalido'),
  currency: currencySchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  categoryId: z.string().uuid().nullable().optional(),
  merchant: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  excluded: z.boolean().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
