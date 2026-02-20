import { z } from 'zod';
import { currencySchema, type ProductType, productTypeSchema } from './enums';

// -- Metadata schemas per product type --

const accountMetadataSchema = z.object({
  accountNumber: z.string().max(4).optional(),
  gmfExempt: z.boolean().default(false),
  interestRate: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/)
    .optional(),
});

const creditCardMetadataSchema = z.object({
  last4Digits: z.string().length(4),
  creditLimit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  cutoffDay: z.number().int().min(1).max(31),
  paymentDueDay: z.number().int().min(1).max(31),
  network: z.enum(['visa', 'mastercard', 'amex', 'other']),
});

const loanMetadataSchema = z.object({
  monthlyPayment: z.string().regex(/^\d+(\.\d{1,2})?$/),
  interestRate: z.string().regex(/^\d+(\.\d{1,4})?$/),
  totalTerm: z.number().int().positive(),
  remainingTerm: z.number().int().min(0),
  originalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

const cdtMetadataSchema = z.object({
  interestRate: z.string().regex(/^\d+(\.\d{1,4})?$/),
  startDate: z.string().date(),
  maturityDate: z.string().date(),
  originalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  autoRenewal: z.boolean().default(false),
});

const investmentMetadataSchema = z.object({
  units: z.number().positive().optional(),
  broker: z.string().max(100).optional(),
});

const emptyMetadataSchema = z.object({});

// -- Map product types to their metadata schema --

export const PRODUCT_TYPE_METADATA_MAP = {
  savings: accountMetadataSchema,
  checking: accountMetadataSchema,
  credit_card: creditCardMetadataSchema,
  loan_free_investment: loanMetadataSchema,
  loan_mortgage: loanMetadataSchema,
  investment_cdt: cdtMetadataSchema,
  investment_fund: investmentMetadataSchema,
  investment_stock: investmentMetadataSchema,
  cash: emptyMetadataSchema,
} as const satisfies Record<ProductType, z.ZodTypeAny>;

// -- Union of all valid metadata shapes --

export const productMetadataSchema = z.union([
  accountMetadataSchema,
  creditCardMetadataSchema,
  loanMetadataSchema,
  cdtMetadataSchema,
  investmentMetadataSchema,
  emptyMetadataSchema,
]);

// -- Request schemas --

export const createProductSchema = z.object({
  type: productTypeSchema,
  name: z.string().min(1).max(100),
  institution: z.string().min(1).max(100),
  balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
  currency: currencySchema,
  metadata: productMetadataSchema.optional().default({}),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  institution: z.string().min(1).max(100).optional(),
  balance: z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid decimal format')
    .optional(),
  currency: currencySchema.optional(),
  metadata: productMetadataSchema.optional(),
});

// -- Response schemas --

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  type: productTypeSchema,
  name: z.string(),
  institution: z.string(),
  balance: z.string(),
  currency: currencySchema,
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const productListResponseSchema = z.object({
  products: z.array(productResponseSchema),
});

// -- Type exports --

export type AccountMetadata = z.infer<typeof accountMetadataSchema>;
export type CreditCardMetadata = z.infer<typeof creditCardMetadataSchema>;
export type LoanMetadata = z.infer<typeof loanMetadataSchema>;
export type CdtMetadata = z.infer<typeof cdtMetadataSchema>;
export type InvestmentMetadata = z.infer<typeof investmentMetadataSchema>;
export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
