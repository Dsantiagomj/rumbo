import { currencySchema } from '@rumbo/shared';
import { z } from 'zod';

export const transferFormSchema = z
  .object({
    sourceProductId: z.string().uuid('Selecciona un producto origen'),
    destinationProductId: z.string().uuid('Selecciona un producto destino'),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato invalido'),
    currency: currencySchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
    notes: z.string().max(500).nullable().optional(),
    exchangeRate: z
      .string()
      .regex(/^\d+(\.\d{1,6})?$/, 'Formato invalido')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.sourceProductId !== data.destinationProductId, {
    message: 'El origen y destino deben ser diferentes',
    path: ['destinationProductId'],
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;
