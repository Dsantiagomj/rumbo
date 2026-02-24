import {
  RiArrowDownLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiExchangeDollarLine,
} from '@remixicon/react';
import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { formatBalance } from '@/features/financial-products/model/constants';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';
import { monthlyTransactionsQueryOptions } from '../model/queries';

type CashFlowCardProps = {
  activeCurrency: Currency;
};

export function CashFlowCard({ activeCurrency }: CashFlowCardProps) {
  const { data, isPending } = useQuery(monthlyTransactionsQueryOptions(activeCurrency));

  const { totalIncome, totalExpenses } = useMemo(() => {
    const transactions = data?.transactions ?? [];
    let income = 0;
    let expenses = 0;
    for (const tx of transactions) {
      if (tx.currency !== activeCurrency) continue;
      const amount = Number.parseFloat(tx.amount);
      if (tx.type === 'income') income += amount;
      else if (tx.type === 'expense') expenses += amount;
    }
    return { totalIncome: income, totalExpenses: expenses };
  }, [data, activeCurrency]);

  const net = totalIncome - totalExpenses;
  const isPositive = net >= 0;
  const total = totalIncome + totalExpenses;
  const incomePercent = total > 0 ? (totalIncome / total) * 100 : 50;

  const monthLabel = new Date().toLocaleDateString('es-CO', { month: 'long' });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiExchangeDollarLine className="size-4 text-muted-foreground" />
          Flujo de caja
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 rounded-full" />
            <Skeleton className="h-8 w-32 rounded" />
          </div>
        ) : total === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Sin transacciones en {monthLabel}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              Registrar transaccion
              <RiArrowRightLine className="size-3" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium capitalize text-muted-foreground">{monthLabel}</p>

            {/* Income vs expenses bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="rounded-l-full bg-emerald-500 transition-all"
                style={{ width: `${incomePercent}%` }}
              />
              <div
                className="rounded-r-full bg-red-400 transition-all"
                style={{ width: `${100 - incomePercent}%` }}
              />
            </div>

            {/* Income / Expenses rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RiArrowUpLine className="size-3.5 text-emerald-500" />
                  Ingresos
                </span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatBalance(String(totalIncome), activeCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RiArrowDownLine className="size-3.5 text-red-400" />
                  Gastos
                </span>
                <span className="text-sm font-semibold tabular-nums text-destructive">
                  {formatBalance(String(totalExpenses), activeCurrency)}
                </span>
              </div>
            </div>

            {/* Net result */}
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Neto</span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                  }`}
                >
                  {isPositive ? '+' : '-'}
                  {formatBalance(String(Math.abs(net)), activeCurrency)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
