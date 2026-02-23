import { categories } from '@rumbo/db/schema';
import type { CreateCategory, UpdateCategory } from '@rumbo/shared/schemas';
import { and, eq, isNull, or } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';

export async function listCategories(db: AppDatabase, userId: string) {
  const results = await db
    .select()
    .from(categories)
    .where(or(eq(categories.userId, userId), isNull(categories.userId)));

  return results.map(serializeCategory);
}

export async function getCategory(db: AppDatabase, userId: string, categoryId: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        or(eq(categories.userId, userId), isNull(categories.userId)),
      ),
    );

  return category ? serializeCategory(category) : null;
}

export async function createCategory(db: AppDatabase, userId: string, data: CreateCategory) {
  const [category] = await db
    .insert(categories)
    .values({
      userId,
      name: data.name,
      parentId: data.parentId ?? null,
    })
    .returning();

  if (!category) {
    throw new Error('Failed to create category');
  }

  return serializeCategory(category);
}

export async function updateCategory(
  db: AppDatabase,
  userId: string,
  categoryId: string,
  data: UpdateCategory,
) {
  const [category] = await db
    .update(categories)
    .set({
      ...data,
      parentId: data.parentId ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return category ? serializeCategory(category) : null;
}

export async function deleteCategory(db: AppDatabase, userId: string, categoryId: string) {
  const [category] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return category ? serializeCategory(category) : null;
}

function serializeCategory(category: typeof categories.$inferSelect) {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    parentId: category.parentId,
    isDefault: Boolean(category.isDefault),
    createdAt:
      category.createdAt instanceof Date
        ? category.createdAt.toISOString()
        : String(category.createdAt),
    updatedAt:
      category.updatedAt instanceof Date
        ? category.updatedAt.toISOString()
        : String(category.updatedAt),
  };
}
