import { categories, financialProducts, transactions } from '@rumbo/db/schema';
import type { CreateTransaction, TransactionType, UpdateTransaction } from '@rumbo/shared/schemas';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';
import { InsufficientBalanceError } from '../../lib/errors.js';

const NON_NEGATIVE_BALANCE_TYPES: ReadonlySet<string> = new Set(['cash']);

type TransactionFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
  types?: string[];
  categories?: string[];
  amountMin?: string;
  amountMax?: string;
  cursor?: string;
  limit: number;
};

function encodeCursor(date: string, id: string): string {
  return Buffer.from(`${date}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { date: string; id: string } {
  const decoded = Buffer.from(cursor, 'base64url').toString();
  const parts = decoded.split('|');
  return { date: parts[0] ?? '', id: parts[1] ?? '' };
}

/**
 * Expand category IDs to include all their children.
 * When filtering by a parent category, we should include transactions
 * assigned to any of its subcategories as well.
 */
async function expandCategoryIds(db: AppDatabase, categoryIds: string[]): Promise<string[]> {
  if (categoryIds.length === 0) return [];

  // Get all children of the provided category IDs
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.parentId, categoryIds));

  const childIds = children.map((c) => c.id);

  // Combine original IDs with child IDs (deduplicated)
  return [...new Set([...categoryIds, ...childIds])];
}

function serializeTransaction(tx: typeof transactions.$inferSelect) {
  return {
    id: tx.id,
    productId: tx.productId,
    categoryId: tx.categoryId,
    transferId: tx.transferId,
    type: tx.type,
    name: tx.name,
    merchant: tx.merchant,
    excluded: Boolean(tx.excluded),
    amount: tx.amount,
    currency: tx.currency as 'COP' | 'USD',
    date: tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : String(tx.date),
    notes: tx.notes,
    createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : String(tx.createdAt),
    updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : String(tx.updatedAt),
  };
}

async function recalculateBalance(db: AppDatabase, productId: string) {
  const [product] = await db
    .select({ currency: financialProducts.currency, metadata: financialProducts.metadata })
    .from(financialProducts)
    .where(eq(financialProducts.id, productId));

  if (!product) return;

  const results = await db
    .select({
      currency: transactions.currency,
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.productId, productId))
    .groupBy(transactions.currency);

  const balanceByCurrency: Record<string, string> = {};
  for (const row of results) {
    balanceByCurrency[row.currency] = Number.parseFloat(row.balance).toFixed(2);
  }

  const mainBalance = balanceByCurrency[product.currency] ?? '0.00';

  const metadata =
    typeof product.metadata === 'string'
      ? (JSON.parse(product.metadata) as Record<string, unknown>)
      : { ...((product.metadata as Record<string, unknown>) ?? {}) };

  const hasUsd = 'balanceUsd' in metadata;

  if (hasUsd) {
    metadata.balanceUsd = balanceByCurrency.USD ?? '0.00';
  }

  await db
    .update(financialProducts)
    .set({
      balance: mainBalance,
      ...(hasUsd ? { metadata } : {}),
      updatedAt: new Date(),
    })
    .where(eq(financialProducts.id, productId));
}

async function validateBalanceConstraint(
  db: AppDatabase,
  productId: string,
  balanceDelta: number,
  currency: string,
) {
  const [product] = await db
    .select({
      type: financialProducts.type,
      balance: financialProducts.balance,
      metadata: financialProducts.metadata,
    })
    .from(financialProducts)
    .where(eq(financialProducts.id, productId));

  if (!product || !NON_NEGATIVE_BALANCE_TYPES.has(product.type)) return;

  let currentBalance: number;
  if (currency === 'USD') {
    const metadata =
      typeof product.metadata === 'string'
        ? (JSON.parse(product.metadata) as Record<string, unknown>)
        : ((product.metadata as Record<string, unknown>) ?? {});
    currentBalance = Number.parseFloat((metadata.balanceUsd as string) ?? '0');
  } else {
    currentBalance = Number.parseFloat(product.balance ?? '0');
  }

  if (currentBalance + balanceDelta < 0) {
    throw new InsufficientBalanceError();
  }
}

export async function getBalanceHistory(db: AppDatabase, userId: string, currency: string) {
  const rows = await db
    .select({
      type: transactions.type,
      amount: transactions.amount,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(financialProducts, eq(transactions.productId, financialProducts.id))
    .where(
      and(
        eq(financialProducts.userId, userId),
        eq(transactions.currency, currency),
        eq(transactions.excluded, false),
      ),
    )
    .orderBy(transactions.date, transactions.createdAt);

  let cumulative = 0;
  const history = rows.map((row) => {
    const amount = Number.parseFloat(row.amount);
    cumulative += row.type === 'income' ? amount : -amount;
    const dateStr =
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt);
    return {
      date: dateStr,
      balance: cumulative.toFixed(2),
    };
  });

  return { history };
}

export async function verifyProductOwnership(db: AppDatabase, userId: string, productId: string) {
  const [product] = await db
    .select({ id: financialProducts.id })
    .from(financialProducts)
    .where(and(eq(financialProducts.id, productId), eq(financialProducts.userId, userId)));

  return product ?? null;
}

export async function listTransactions(
  db: AppDatabase,
  userId: string,
  productId: string,
  filters: TransactionFilters,
) {
  const product = await verifyProductOwnership(db, userId, productId);
  if (!product) return null;

  const conditions = [eq(transactions.productId, productId)];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    const searchCondition = or(
      ilike(transactions.name, pattern),
      ilike(transactions.merchant, pattern),
      ilike(transactions.notes, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (filters.startDate) {
    conditions.push(sql`${transactions.date} >= ${filters.startDate}`);
  }

  if (filters.endDate) {
    conditions.push(sql`${transactions.date} <= ${filters.endDate}`);
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(transactions.type, filters.types as TransactionType[]));
  }

  if (filters.categories && filters.categories.length > 0) {
    // Expand parent categories to include their children
    const expandedCategoryIds = await expandCategoryIds(db, filters.categories);
    conditions.push(inArray(transactions.categoryId, expandedCategoryIds));
  }

  if (filters.amountMin) {
    conditions.push(
      sql`CAST(${transactions.amount} AS NUMERIC) >= CAST(${filters.amountMin} AS NUMERIC)`,
    );
  }

  if (filters.amountMax) {
    conditions.push(
      sql`CAST(${transactions.amount} AS NUMERIC) <= CAST(${filters.amountMax} AS NUMERIC)`,
    );
  }

  if (filters.cursor) {
    const { date: cursorDate, id: cursorId } = decodeCursor(filters.cursor);
    const cursorCondition = or(
      sql`${transactions.date} < ${cursorDate}`,
      and(sql`${transactions.date} = ${cursorDate}`, sql`${transactions.id} < ${cursorId}`),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(filters.limit + 1);

  const hasMore = rows.length > filters.limit;
  const data = hasMore ? rows.slice(0, filters.limit) : rows;
  const lastItem = data[data.length - 1];

  return {
    transactions: data.map(serializeTransaction),
    nextCursor:
      hasMore && lastItem
        ? encodeCursor(
            lastItem.date instanceof Date
              ? lastItem.date.toISOString().slice(0, 10)
              : String(lastItem.date),
            lastItem.id,
          )
        : null,
  };
}

type GlobalTransactionFilters = TransactionFilters & {
  productIds?: string[];
};

function serializeGlobalTransaction(
  tx: typeof transactions.$inferSelect,
  productName: string,
  productType: string,
) {
  return {
    ...serializeTransaction(tx),
    productName,
    productType,
  };
}

export async function listAllTransactions(
  db: AppDatabase,
  userId: string,
  filters: GlobalTransactionFilters,
) {
  const conditions = [eq(financialProducts.userId, userId)];

  if (filters.productIds && filters.productIds.length > 0) {
    conditions.push(inArray(transactions.productId, filters.productIds));
  }

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    const searchCondition = or(
      ilike(transactions.name, pattern),
      ilike(transactions.merchant, pattern),
      ilike(transactions.notes, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (filters.startDate) {
    conditions.push(sql`${transactions.date} >= ${filters.startDate}`);
  }

  if (filters.endDate) {
    conditions.push(sql`${transactions.date} <= ${filters.endDate}`);
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(transactions.type, filters.types as TransactionType[]));
  }

  if (filters.categories && filters.categories.length > 0) {
    // Expand parent categories to include their children
    const expandedCategoryIds = await expandCategoryIds(db, filters.categories);
    conditions.push(inArray(transactions.categoryId, expandedCategoryIds));
  }

  if (filters.amountMin) {
    conditions.push(
      sql`CAST(${transactions.amount} AS NUMERIC) >= CAST(${filters.amountMin} AS NUMERIC)`,
    );
  }

  if (filters.amountMax) {
    conditions.push(
      sql`CAST(${transactions.amount} AS NUMERIC) <= CAST(${filters.amountMax} AS NUMERIC)`,
    );
  }

  if (filters.cursor) {
    const { date: cursorDate, id: cursorId } = decodeCursor(filters.cursor);
    const cursorCondition = or(
      sql`${transactions.date} < ${cursorDate}`,
      and(sql`${transactions.date} = ${cursorDate}`, sql`${transactions.id} < ${cursorId}`),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select({
      transaction: transactions,
      productName: financialProducts.name,
      productType: financialProducts.type,
    })
    .from(transactions)
    .innerJoin(financialProducts, eq(transactions.productId, financialProducts.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(filters.limit + 1);

  const hasMore = rows.length > filters.limit;
  const data = hasMore ? rows.slice(0, filters.limit) : rows;
  const lastItem = data[data.length - 1];

  return {
    transactions: data.map((row) =>
      serializeGlobalTransaction(row.transaction, row.productName, row.productType),
    ),
    nextCursor:
      hasMore && lastItem
        ? encodeCursor(
            lastItem.transaction.date instanceof Date
              ? lastItem.transaction.date.toISOString().slice(0, 10)
              : String(lastItem.transaction.date),
            lastItem.transaction.id,
          )
        : null,
  };
}

export async function getTransaction(db: AppDatabase, userId: string, transactionId: string) {
  const [result] = await db
    .select({ transaction: transactions })
    .from(transactions)
    .innerJoin(financialProducts, eq(transactions.productId, financialProducts.id))
    .where(and(eq(transactions.id, transactionId), eq(financialProducts.userId, userId)));

  return result ? serializeTransaction(result.transaction) : null;
}

export async function createTransaction(
  db: AppDatabase,
  productId: string,
  data: Omit<CreateTransaction, 'productId'>,
) {
  const amount = Number.parseFloat(data.amount);
  const delta = data.type === 'income' ? amount : -amount;
  await validateBalanceConstraint(db, productId, delta, data.currency);

  const [tx] = await db
    .insert(transactions)
    .values({
      productId,
      categoryId: data.categoryId ?? null,
      type: data.type,
      name: data.name,
      merchant: data.merchant ?? null,
      excluded: data.excluded ?? false,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      notes: data.notes ?? null,
    })
    .returning();

  if (!tx) throw new Error('Failed to create transaction');

  await recalculateBalance(db, productId);
  return serializeTransaction(tx);
}

export async function updateTransaction(
  db: AppDatabase,
  userId: string,
  transactionId: string,
  data: Omit<UpdateTransaction, 'productId'>,
) {
  const existing = await getTransaction(db, userId, transactionId);
  if (!existing) return null;

  const oldAmount = Number.parseFloat(existing.amount);
  const oldDelta = existing.type === 'income' ? oldAmount : -oldAmount;
  const newAmount = Number.parseFloat(data.amount ?? existing.amount);
  const newType = data.type ?? existing.type;
  const newDelta = newType === 'income' ? newAmount : -newAmount;
  const txCurrency = data.currency ?? existing.currency;
  await validateBalanceConstraint(db, existing.productId, newDelta - oldDelta, txCurrency);

  const [updated] = await db
    .update(transactions)
    .set({
      ...data,
      categoryId: data.categoryId ?? undefined,
      merchant: data.merchant ?? undefined,
      notes: data.notes ?? undefined,
      excluded: data.excluded ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId))
    .returning();

  if (!updated) return null;

  await recalculateBalance(db, existing.productId);
  return serializeTransaction(updated);
}

export async function bulkDeleteTransactions(
  db: AppDatabase,
  userId: string,
  ids: string[],
): Promise<{ deleted: number; failed: Array<{ id: string; reason: string }> }> {
  const failed: Array<{ id: string; reason: string }> = [];
  let totalDeleted = 0;

  // Fetch all requested transactions with ownership verification
  const rows = await db
    .select({ transaction: transactions, productType: financialProducts.type })
    .from(transactions)
    .innerJoin(financialProducts, eq(transactions.productId, financialProducts.id))
    .where(and(inArray(transactions.id, ids), eq(financialProducts.userId, userId)));

  const foundMap = new Map(rows.map((r) => [r.transaction.id, r]));

  // Mark not-found IDs as failed
  for (const id of ids) {
    if (!foundMap.has(id)) {
      failed.push({ id, reason: 'Transaction not found' });
    }
  }

  // Separate deletable from "Balance inicial" (undeletable)
  const deletable: typeof rows = [];
  for (const row of rows) {
    if (row.transaction.name === 'Balance inicial' && row.transaction.categoryId === null) {
      failed.push({ id: row.transaction.id, reason: 'Cannot delete initial balance transaction' });
    } else {
      deletable.push(row);
    }
  }

  // Group by productId
  const byProduct = new Map<string, typeof deletable>();
  for (const row of deletable) {
    const productId = row.transaction.productId;
    const group = byProduct.get(productId);
    if (group) {
      group.push(row);
    } else {
      byProduct.set(productId, [row]);
    }
  }

  // Process each product group independently
  for (const [productId, group] of byProduct) {
    let totalDelta = 0;
    for (const row of group) {
      const amount = Number.parseFloat(row.transaction.amount);
      totalDelta += row.transaction.type === 'income' ? -amount : amount;
    }

    const currency = group[0]!.transaction.currency;

    try {
      if (NON_NEGATIVE_BALANCE_TYPES.has(group[0]!.productType)) {
        await validateBalanceConstraint(db, productId, totalDelta, currency);
      }

      const groupIds = group.map((r) => r.transaction.id);
      await db.delete(transactions).where(inArray(transactions.id, groupIds));
      totalDeleted += groupIds.length;

      await recalculateBalance(db, productId);
    } catch (error) {
      const reason =
        error instanceof InsufficientBalanceError
          ? 'Insufficient balance after deletion'
          : 'Deletion failed';
      for (const row of group) {
        failed.push({ id: row.transaction.id, reason });
      }
    }
  }

  return { deleted: totalDeleted, failed };
}

export async function deleteTransaction(db: AppDatabase, userId: string, transactionId: string) {
  const existing = await getTransaction(db, userId, transactionId);
  if (!existing) return null;

  const amount = Number.parseFloat(existing.amount);
  const delta = existing.type === 'income' ? -amount : amount;
  await validateBalanceConstraint(db, existing.productId, delta, existing.currency);

  const [deleted] = await db
    .delete(transactions)
    .where(eq(transactions.id, transactionId))
    .returning();

  if (!deleted) return null;

  await recalculateBalance(db, existing.productId);
  return serializeTransaction(deleted);
}
