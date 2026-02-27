import { categories, financialProducts, transactions } from '@rumbo/db/schema';
import type { CreateCategory, UpdateCategory } from '@rumbo/shared/schemas';
import { and, count, eq, isNull, or } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';

export async function listCategories(db: AppDatabase, userId: string) {
  const results = await db
    .select({
      id: categories.id,
      userId: categories.userId,
      name: categories.name,
      parentId: categories.parentId,
      isDefault: categories.isDefault,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      transactionCount: count(financialProducts.id),
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .leftJoin(
      financialProducts,
      and(eq(financialProducts.id, transactions.productId), eq(financialProducts.userId, userId)),
    )
    .where(or(eq(categories.userId, userId), isNull(categories.userId)))
    .groupBy(categories.id);

  return results.map(serializeCategoryWithCount);
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

  if (!category) {
    return null;
  }

  const transactionCount = await countTransactionsForCategory(db, userId, category.id);
  return serializeCategory(category, transactionCount);
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

  if (!category) {
    return null;
  }

  const transactionCount = await countTransactionsForCategory(db, userId, category.id);
  return serializeCategory(category, transactionCount);
}

export async function deleteCategory(db: AppDatabase, userId: string, categoryId: string) {
  const [category] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return category ? serializeCategory(category) : null;
}

async function countTransactionsForCategory(db: AppDatabase, userId: string, categoryId: string) {
  const [result] = await db
    .select({
      transactionCount: count(financialProducts.id),
    })
    .from(transactions)
    .innerJoin(
      financialProducts,
      and(eq(financialProducts.id, transactions.productId), eq(financialProducts.userId, userId)),
    )
    .where(eq(transactions.categoryId, categoryId));

  return Number(result?.transactionCount ?? 0);
}

function serializeCategory(category: typeof categories.$inferSelect, transactionCount = 0) {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    parentId: category.parentId,
    isDefault: Boolean(category.isDefault),
    transactionCount,
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

interface CategoryWithCount {
  id: string;
  userId: string | null;
  name: string;
  parentId: string | null;
  isDefault: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  transactionCount: number;
}

function serializeCategoryWithCount(category: CategoryWithCount) {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    parentId: category.parentId,
    isDefault: Boolean(category.isDefault),
    transactionCount: Number(category.transactionCount),
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
