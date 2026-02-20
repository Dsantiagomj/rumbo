import { z } from '@hono/zod-openapi';
import {
  createProductSchema,
  productListResponseSchema,
  productResponseSchema,
  updateProductSchema,
} from '@rumbo/shared/schemas';

export const createProductBodySchema = createProductSchema.openapi('CreateProduct');
export const updateProductBodySchema = updateProductSchema.openapi('UpdateProduct');
export const productResponse = productResponseSchema.openapi('FinancialProduct');
export const productListResponse = productListResponseSchema.openapi('FinancialProductList');

export const productIdParamSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Financial product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
});
