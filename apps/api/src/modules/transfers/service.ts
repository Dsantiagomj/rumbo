import { financialProducts, transactions } from '@rumbo/db/schema';
import type { CreateTransfer } from '@rumbo/shared/schemas';
import { and, eq } from 'drizzle-orm';
import type { AppDatabase } from '../../lib/db.js';
import { recalculateBalance, validateBalanceConstraint } from '../transactions/service.js';
import { getCurrentTRM } from '../trm/service.js';

export async function createTransfer(db: AppDatabase, userId: string, input: CreateTransfer) {
  // 1. Verify source product belongs to user
  const [sourceProduct] = await db
    .select({
      id: financialProducts.id,
      name: financialProducts.name,
      currency: financialProducts.currency,
      type: financialProducts.type,
    })
    .from(financialProducts)
    .where(
      and(eq(financialProducts.id, input.sourceProductId), eq(financialProducts.userId, userId)),
    );

  if (!sourceProduct) return null;

  // 2. Verify destination product belongs to user
  const [destProduct] = await db
    .select({
      id: financialProducts.id,
      name: financialProducts.name,
      currency: financialProducts.currency,
      type: financialProducts.type,
    })
    .from(financialProducts)
    .where(
      and(
        eq(financialProducts.id, input.destinationProductId),
        eq(financialProducts.userId, userId),
      ),
    );

  if (!destProduct) return null;

  // 3. Determine currencies and cross-currency logic
  const sourceCurrency = sourceProduct.currency;
  const destCurrency = destProduct.currency;
  const isCrossCurrency = sourceCurrency !== destCurrency;

  // 4. Calculate destination amount
  let destAmountStr = input.amount;
  let exchangeRateUsed: string | null = null;

  if (isCrossCurrency) {
    let rate: number;
    if (input.exchangeRate) {
      rate = Number.parseFloat(input.exchangeRate);
    } else {
      const trm = await getCurrentTRM();
      rate = trm.rate;
    }
    exchangeRateUsed = rate.toString();

    const sourceAmount = Number.parseFloat(input.amount);

    if (sourceCurrency === 'COP' && destCurrency === 'USD') {
      // COP -> USD: divide by rate
      const destAmount = sourceAmount / rate;
      destAmountStr = destAmount.toFixed(2);
    } else if (sourceCurrency === 'USD' && destCurrency === 'COP') {
      // USD -> COP: multiply by rate
      const destAmount = sourceAmount * rate;
      destAmountStr = destAmount.toFixed(2);
    }
  }

  // 5. Generate shared transfer ID
  const transferId = crypto.randomUUID();

  // 6. Execute within a database transaction
  const result = await db.transaction(async (tx) => {
    const txDb = tx as unknown as AppDatabase;

    // a. Validate balance constraint on source product (expense reduces balance)
    const sourceAmount = Number.parseFloat(input.amount);
    await validateBalanceConstraint(txDb, input.sourceProductId, -sourceAmount, sourceCurrency);

    // b. Insert source leg (expense from source product)
    const [sourceTx] = await tx
      .insert(transactions)
      .values({
        productId: input.sourceProductId,
        type: 'expense',
        name: `Transferencia a ${destProduct.name}`,
        amount: input.amount,
        currency: sourceCurrency,
        date: input.date,
        notes: input.notes ?? null,
        categoryId: null,
        excluded: true,
        transferId,
      })
      .returning();

    if (!sourceTx) throw new Error('Failed to create source transaction');

    // c. Insert destination leg (income to destination product)
    const [destTx] = await tx
      .insert(transactions)
      .values({
        productId: input.destinationProductId,
        type: 'income',
        name: `Transferencia de ${sourceProduct.name}`,
        amount: destAmountStr,
        currency: destCurrency,
        date: input.date,
        notes: input.notes ?? null,
        categoryId: null,
        excluded: true,
        transferId,
      })
      .returning();

    if (!destTx) throw new Error('Failed to create destination transaction');

    // d. Recalculate balance on both products
    await recalculateBalance(txDb, input.sourceProductId);
    await recalculateBalance(txDb, input.destinationProductId);

    return { sourceTx, destTx };
  });

  // 7. Serialize and return
  return {
    transferId,
    sourceTransaction: serializeTransaction(result.sourceTx),
    destinationTransaction: serializeTransaction(result.destTx),
    exchangeRate: exchangeRateUsed,
  };
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
