import { RiArrowRightLine, RiFileListLine } from '@remixicon/react';
import type { Currency, GlobalTransactionResponse } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  formatBalance,
  TRANSACTION_TYPE_LABELS,
} from '@/features/financial-products/model/constants';
import { setBreadcrumbLabel } from '@/shared/lib/useBreadcrumbStore';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';
import { recentTransactionsQueryOptions } from '../model/queries';

function TransactionRow({ transaction }: { transaction: GlobalTransactionResponse }) {
  const isExpense = transaction.type === 'expense';
  const amount = formatBalance(transaction.amount, transaction.currency as Currency);
  const displayAmount = isExpense ? `-${amount}` : `+${amount}`;

  return (
    <Link
      to="/products/$productId/transactions/$transactionId"
      params={{ productId: transaction.productId, transactionId: transaction.id }}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
      viewTransition
      onClick={() => setBreadcrumbLabel(transaction.id, transaction.name)}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="text-[10px] font-semibold text-primary">
          {TRANSACTION_TYPE_LABELS[transaction.type]?.charAt(0) ?? '?'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{transaction.name}</p>
          <p
            className={`shrink-0 text-sm font-semibold tabular-nums ${
              isExpense ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {displayAmount}
          </p>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{transaction.productName}</p>
      </div>
    </Link>
  );
}

export function RecentTransactionsCard() {
  const { data, isPending } = useQuery(recentTransactionsQueryOptions());
  const transactions = data?.transactions ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiFileListLine className="size-4 text-muted-foreground" />
          Transacciones recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="-mx-2 flex flex-1 flex-col gap-1">
        {isPending ? (
          <div className="space-y-3 px-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Aun no tienes transacciones registradas
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              Registrar primera transaccion
              <RiArrowRightLine className="size-3" />
            </Link>
          </div>
        ) : (
          <>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
            <Link
              to="/transactions"
              className="mt-2 inline-flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todas
              <RiArrowRightLine className="size-3" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
