import { financialProducts, transactions } from '@rumbo/db/schema';
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
  const [result] = await db
    .select({
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.productId, productId));

  const rawBalance = result?.balance ?? '0';
  const normalizedBalance = Number.parseFloat(rawBalance).toFixed(2);

  await db
    .update(financialProducts)
    .set({ balance: normalizedBalance, updatedAt: new Date() })
    .where(eq(financialProducts.id, productId));
}

async function validateBalanceConstraint(db: AppDatabase, productId: string, balanceDelta: number) {
  const [product] = await db
    .select({ type: financialProducts.type, balance: financialProducts.balance })
    .from(financialProducts)
    .where(eq(financialProducts.id, productId));

  if (!product || !NON_NEGATIVE_BALANCE_TYPES.has(product.type)) return;

  const currentBalance = Number.parseFloat(product.balance ?? '0');
  if (currentBalance + balanceDelta < 0) {
    throw new InsufficientBalanceError();
  }
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
    conditions.push(inArray(transactions.categoryId, filters.categories));
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
  await validateBalanceConstraint(db, productId, delta);

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
  await validateBalanceConstraint(db, existing.productId, newDelta - oldDelta);

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

export async function deleteTransaction(db: AppDatabase, userId: string, transactionId: string) {
  const existing = await getTransaction(db, userId, transactionId);
  if (!existing) return null;

  const amount = Number.parseFloat(existing.amount);
  const delta = existing.type === 'income' ? -amount : amount;
  await validateBalanceConstraint(db, existing.productId, delta);

  const [deleted] = await db
    .delete(transactions)
    .where(eq(transactions.id, transactionId))
    .returning();

  if (!deleted) return null;

  await recalculateBalance(db, existing.productId);
  return serializeTransaction(deleted);
}
