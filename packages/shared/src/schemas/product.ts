import { z } from 'zod';
import { currencySchema, productTypeSchema } from './enums';

export const productMetadataSchema = z
  .object({
    creditLimit: z.string().optional(),
    billingCycleDay: z.number().int().min(1).max(31).optional(),
    closingDate: z.number().int().min(1).max(31).optional(),
    paymentDate: z.number().int().min(1).max(31).optional(),
    term: z.number().int().positive().optional(),
    interestRate: z.string().optional(),
    monthlyPayment: z.string().optional(),
    remainingBalance: z.string().optional(),
    returnRate: z.string().optional(),
    startDate: z.string().optional(),
    maturityDate: z.string().optional(),
  })
  .passthrough();

export const createProductSchema = z.object({
  type: productTypeSchema,
  name: z.string().min(1).max(100),
  balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  metadata: productMetadataSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ type: true });

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
