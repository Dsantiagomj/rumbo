import { z } from '@hono/zod-openapi';
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@rumbo/shared/schemas';

export const createCategoryBodySchema = createCategorySchema.openapi('CreateCategory');
export const updateCategoryBodySchema = updateCategorySchema.openapi('UpdateCategory');
export const categoryResponse = categoryResponseSchema.openapi('Category');
export const categoryListResponse = categoryListResponseSchema.openapi('CategoryList');

export const categoryIdParamSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
});
