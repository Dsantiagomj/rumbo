import { financialProducts, transactions } from '@rumbo/db/schema';
import type { CreateProduct, Currency, UpdateProduct } from '@rumbo/shared/schemas';
import { and, eq } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';
import { InsufficientBalanceError } from '../../lib/errors.js';

const NON_NEGATIVE_BALANCE_TYPES: ReadonlySet<string> = new Set(['cash']);

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
  if (NON_NEGATIVE_BALANCE_TYPES.has(data.type) && Number.parseFloat(data.balance) < 0) {
    throw new InsufficientBalanceError();
  }

  return await db.transaction(async (tx) => {
    const [product] = await tx
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

    const balanceNum = Number.parseFloat(data.balance);
    if (balanceNum !== 0) {
      await tx.insert(transactions).values({
        productId: product.id,
        type: balanceNum >= 0 ? 'income' : 'expense',
        name: 'Balance inicial',
        amount: Math.abs(balanceNum).toFixed(2),
        currency: data.currency,
        date: new Date(),
        excluded: false,
      });
    }

    return serializeProduct(product);
  });
}

export async function updateProduct(
  db: AppDatabase,
  userId: string,
  productId: string,
  data: UpdateProduct,
) {
  if (data.balance !== undefined && Number.parseFloat(data.balance) < 0) {
    const [existing] = await db
      .select({ type: financialProducts.type })
      .from(financialProducts)
      .where(and(eq(financialProducts.id, productId), eq(financialProducts.userId, userId)));

    if (existing && NON_NEGATIVE_BALANCE_TYPES.has(existing.type)) {
      throw new InsufficientBalanceError();
    }
  }

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
    currency: product.currency as Currency,
    metadata:
      typeof product.metadata === 'string'
        ? (JSON.parse(product.metadata) as Record<string, unknown>)
        : product.metadata,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : String(product.createdAt),
    updatedAt:
      product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : String(product.updatedAt),
  };
}
