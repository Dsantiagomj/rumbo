import {
  RiAddLine,
  RiArrowDownSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiSearchLine,
} from '@remixicon/react';
import type { Currency, TransactionResponse } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button, Input, Skeleton } from '@/shared/ui';
import { listCategoriesQueryOptions } from '../model/category-queries';
import { formatBalance } from '../model/constants';
import { listTransactionsQueryOptions } from '../model/transaction-queries';

type TransactionsSectionProps = {
  productId: string;
  balance: string;
  currency: Currency;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
      <RiArrowDownSLine className="h-3.5 w-3.5" />
    </button>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-muted-foreground/60 hover:text-muted-foreground"
        >
          <RiInformationLine className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={4}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function groupByDate(transactions: TransactionResponse[]): Map<string, TransactionResponse[]> {
  const groups = new Map<string, TransactionResponse[]>();
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

function TransactionCard({
  transaction,
  productId,
  currency,
  categoryName,
  onSelect,
  isSelected,
}: {
  transaction: TransactionResponse;
  productId: string;
  currency: Currency;
  categoryName: string;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const isExpense = transaction.type === 'expense';
  const amount = formatBalance(transaction.amount, currency);
  const displayAmount = isExpense ? `-${amount}` : `+${amount}`;

  return (
    <div className="group relative rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Seleccionar ${transaction.name}`}
          className="mt-0.5"
        />
        <Link
          to="/products/$productId/transactions/$transactionId"
          params={{ productId, transactionId: transaction.id }}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xs font-medium text-primary">
              {TYPE_LABELS[transaction.type]?.charAt(0) ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold truncate">{transaction.name}</p>
              <p
                className={`text-sm font-bold tabular-nums shrink-0 ${
                  isExpense ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {displayAmount}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <RiPriceTag3Line className="mr-1 h-2.5 w-2.5" />
                {categoryName}
              </span>
              {transaction.merchant && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {transaction.merchant}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <div className="absolute top-3 right-3 hidden items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-sm md:group-hover:flex">
        <Link
          to="/products/$productId/transactions/$transactionId"
          params={{ productId, transactionId: transaction.id }}
          search={{ edit: true }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Editar"
        >
          <RiEditLine className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/products/$productId/transactions/$transactionId"
          params={{ productId, transactionId: transaction.id }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Ver detalle"
        >
          <RiDeleteBinLine className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function TransactionsSection({ productId, currency }: TransactionsSectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isPending } = useQuery(listTransactionsQueryOptions(productId));
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const transactions = data?.transactions ?? [];
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData?.categories ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  const dateGroups = useMemo(() => groupByDate(transactions), [transactions]);
  const allTransactionIds = transactions.map((t) => t.id);

  const hasSelection = selectedIds.size > 0;
  const isAllSelected =
    selectedIds.size === allTransactionIds.length && allTransactionIds.length > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allTransactionIds));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Transacciones</h3>
        <Button size="sm" asChild>
          <Link to="/products/$productId/transactions/new" params={{ productId }}>
            <RiAddLine className="h-3.5 w-3.5" />
            Nueva
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar transaccion..." className="pl-9" disabled />
        </div>
        <div className="flex gap-1.5">
          <FilterChip label="Categoria" />
          <FilterChip label="Tipo" />
          <FilterChip label="Fecha" />
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No hay transacciones</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea la primera transaccion para este producto
          </p>
          <Button size="sm" variant="outline" className="mt-4" asChild>
            <Link to="/products/$productId/transactions/new" params={{ productId }}>
              <RiAddLine className="h-3.5 w-3.5" />
              Nueva transaccion
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Seleccionar todas las transacciones"
            />
            <span className="flex-1 text-xs font-medium text-muted-foreground">
              Seleccionar todas
            </span>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {transactions.length} transaccion{transactions.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {Array.from(dateGroups.entries()).map(([dateKey, txns]) => (
            <div key={dateKey}>
              <div className="flex items-center justify-between px-1 py-2 text-xs font-semibold text-muted-foreground">
                <p className="uppercase">
                  <span>{formatDateHeader(dateKey)}</span>
                  <span className="mx-1.5">&middot;</span>
                  <span>{txns.length}</span>
                </p>
                <InfoTip text="Balance al final del dia, despues de todas las transacciones" />
              </div>

              <div className="space-y-2">
                {txns.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    productId={productId}
                    currency={currency}
                    categoryName={categoryMap.get(tx.categoryId ?? '') ?? 'Sin categoria'}
                    isSelected={selectedIds.has(tx.id)}
                    onSelect={() => toggleSelection(tx.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 z-50 flex w-[90%] -translate-x-1/2 items-center justify-between rounded-xl bg-foreground px-4 py-2.5 text-sm text-background md:w-[420px]">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={true}
              onCheckedChange={clearSelection}
              className="border-background/30 data-checked:bg-background data-checked:text-foreground data-checked:border-background"
            />
            <span>
              {selectedIds.size} transaccion{selectedIds.size !== 1 ? 'es' : ''} seleccionada
              {selectedIds.size !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            type="button"
            disabled
            className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-background/20 disabled:opacity-50"
            aria-label="Eliminar seleccionadas"
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
