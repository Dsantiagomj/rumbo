import { financialProducts } from '@rumbo/db/schema';
import type { CreateProduct, UpdateProduct } from '@rumbo/shared/schemas';
import { and, eq } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';

export async function listProducts(db: AppDatabase, userId: string) {
  const results = await db
    .select()
    .from(financialProducts)
    .where(eq(financialProducts.userId, userId));

  return results.map(serializeProduct);
}

export async function getProduct(db: AppDatabase, userId: string, productId: string) {
  const [product] = await db
    .select()
    .from(financialProducts)
    .where(and(eq(financialProducts.id, productId), eq(financialProducts.userId, userId)));

  return product ? serializeProduct(product) : null;
}

export async function createProduct(db: AppDatabase, userId: string, data: CreateProduct) {
  const [product] = await db
    .insert(financialProducts)
    .values({
      userId,
      type: data.type,
      name: data.name,
      institution: data.institution,
      balance: data.balance,
      currency: data.currency,
      metadata: data.metadata ?? {},
    })
    .returning();

  if (!product) {
    throw new Error('Failed to create product');
  }

  return serializeProduct(product);
}

export async function updateProduct(
  db: AppDatabase,
  userId: string,
  productId: string,
  data: UpdateProduct,
) {
  const [product] = await db
    .update(financialProducts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(financialProducts.id, productId), eq(financialProducts.userId, userId)))
    .returning();

  return product ? serializeProduct(product) : null;
}

export async function deleteProduct(db: AppDatabase, userId: string, productId: string) {
  const [product] = await db
    .delete(financialProducts)
    .where(and(eq(financialProducts.id, productId), eq(financialProducts.userId, userId)))
    .returning();

  return product ? serializeProduct(product) : null;
}

function serializeProduct(product: typeof financialProducts.$inferSelect) {
  return {
    id: product.id,
    userId: product.userId,
    type: product.type,
    name: product.name,
    institution: product.institution,
    balance: product.balance,
    currency: product.currency,
    metadata: product.metadata,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
