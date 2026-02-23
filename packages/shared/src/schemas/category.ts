import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const categoryListResponseSchema = z.object({
  categories: z.array(categoryResponseSchema),
});

export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
