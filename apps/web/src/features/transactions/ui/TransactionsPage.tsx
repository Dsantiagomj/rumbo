import {
  RiArrowRightSLine,
  RiCloseLine,
  RiFilterLine,
  RiPriceTag3Line,
  RiSearchLine,
} from '@remixicon/react';
import type { Currency, GlobalTransactionResponse } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatBalance,
  TRANSACTION_TYPE_LABELS,
} from '@/features/financial-products/model/constants';
import { setBreadcrumbLabel } from '@/shared/lib/useBreadcrumbStore';
import { Button, Input, Skeleton } from '@/shared/ui';
import { useTransactionsPage } from './useTransactionsPage';

function groupByDate(
  transactions: GlobalTransactionResponse[],
): Map<string, GlobalTransactionResponse[]> {
  const groups = new Map<string, GlobalTransactionResponse[]>();
  for (const tx of transactions) {
    const dateKey = tx.date.slice(0, 10);
    const group = groups.get(dateKey);
    if (group) {
      group.push(tx);
    } else {
      groups.set(dateKey, [tx]);
    }
  }
  return groups;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function GlobalTransactionCard({
  transaction,
  categoryName,
}: {
  transaction: GlobalTransactionResponse;
  categoryName: string;
}) {
  const isExpense = transaction.type === 'expense';
  const amount = formatBalance(transaction.amount, transaction.currency as Currency);
  const displayAmount = isExpense ? `-${amount}` : `+${amount}`;

  return (
    <Link
      to="/products/$productId/transactions/$transactionId"
      params={{ productId: transaction.productId, transactionId: transaction.id }}
      search={{ from: 'transactions' }}
      className="group block rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
      viewTransition
      onClick={() => setBreadcrumbLabel(transaction.id, transaction.name)}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="text-xs font-medium text-primary">
            {TRANSACTION_TYPE_LABELS[transaction.type]?.charAt(0) ?? '?'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{transaction.name}</p>
            <p
              className={`shrink-0 text-sm font-bold tabular-nums ${
                isExpense ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {displayAmount}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <RiPriceTag3Line className="mr-1 h-2.5 w-2.5" />
              {categoryName}
            </span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {transaction.productName}
            </span>
            {transaction.merchant && (
              <span className="truncate text-[11px] text-muted-foreground">
                {transaction.merchant}
              </span>
            )}
          </div>
        </div>
        <RiArrowRightSLine className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

export function TransactionsPage() {
  const {
    transactions,
    products,
    categories,
    categoryMap,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    search,
    setSearch,
    selectedProductId,
    setSelectedProductId,
    selectedType,
    setSelectedType,
    selectedCategoryId,
    setSelectedCategoryId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
    hasActiveFilters,
  } = useTransactionsPage();

  const dateGroups = useMemo(() => groupByDate(transactions), [transactions]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o comercio..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <RiFilterLine className="h-4 w-4 text-muted-foreground" />

        {/* Product filter */}
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Todas las cuentas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="income">Ingreso</SelectItem>
            <SelectItem value="expense">Gasto</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-8 w-[140px] text-xs"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-8 w-[140px] text-xs"
          placeholder="Hasta"
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
            <RiCloseLine className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Transaction count */}
      {!isPending && transactions.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            {transactions.length} transaccion{transactions.length !== 1 ? 'es' : ''}
            {hasNextPage && '+'}
          </span>
        </div>
      )}

      {/* Content */}
      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No se encontraron transacciones con los filtros seleccionados'
              : 'No hay transacciones'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {Array.from(dateGroups.entries()).map(([dateKey, txns]) => (
            <div key={dateKey}>
              <div className="flex items-center justify-between px-1 py-2 text-xs font-semibold text-muted-foreground">
                <p className="uppercase">
                  <span>{formatDateHeader(dateKey)}</span>
                  <span className="mx-1.5">&middot;</span>
                  <span>{txns.length}</span>
                </p>
              </div>
              <div className="space-y-2">
                {txns.map((tx) => (
                  <GlobalTransactionCard
                    key={tx.id}
                    transaction={tx}
                    categoryName={categoryMap.get(tx.categoryId ?? '') ?? 'Sin categoria'}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Cargando...' : 'Cargar mas'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
