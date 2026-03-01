import {
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEqualizerLine,
  RiPriceTag3Line,
  RiSearchLine,
} from '@remixicon/react';
import { type Currency, type GlobalTransactionResponse, isInitialBalance } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { sileo } from 'sileo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useBulkDeleteTransactionsMutation } from '../model/queries';
import { CategoryFilterField } from './components/CategoryFilterField';
import { DateRangeFilter } from './components/DateRangeFilter';
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
  isSelectable,
  isSelected,
  onToggleSelect,
}: {
  transaction: GlobalTransactionResponse;
  categoryName: string;
  isSelectable: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const isExpense = transaction.type === 'expense';
  const amount = formatBalance(transaction.amount, transaction.currency as Currency);
  const displayAmount = isExpense ? `-${amount}` : `+${amount}`;
  const isBalanceInicial = isInitialBalance(transaction);

  return (
    <div className="flex items-center gap-2">
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Seleccionar ${transaction.name}`}
          className="shrink-0"
        />
      )}
      <Link
        to="/products/$productId/transactions/$transactionId"
        params={{ productId: transaction.productId, transactionId: transaction.id }}
        search={{ from: 'transactions' }}
        className="group block flex-1 rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
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
              {!isBalanceInicial && (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <RiPriceTag3Line className="mr-1 h-2.5 w-2.5" />
                  {categoryName}
                </span>
              )}
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
    </div>
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
    datePreset,
    setDatePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    showFilters,
    setShowFilters,
    // Selection
    selectedIds,
    selectableIds,
    hasSelection,
    isAllSelected,
    isAllIndeterminate,
    toggleSelection,
    toggleGroupSelection,
    toggleSelectAll,
    clearSelection,
  } = useTransactionsPage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const bulkDeleteMutation = useBulkDeleteTransactionsMutation();

  const dateGroups = useMemo(() => groupByDate(transactions), [transactions]);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await bulkDeleteMutation.mutateAsync(ids);
      clearSelection();
      setShowDeleteDialog(false);

      if (result.deleted > 0) {
        sileo.success({
          title: `${result.deleted} transaccion${result.deleted !== 1 ? 'es' : ''} eliminada${result.deleted !== 1 ? 's' : ''}`,
        });
      }
      if (result.failed.length > 0) {
        sileo.error({
          title:
            result.deleted > 0
              ? `${result.failed.length} no pudieron ser eliminadas`
              : 'No se pudieron eliminar las transacciones',
          description: result.failed.map((f) => f.reason).join(', '),
        });
      }
    } catch {
      setShowDeleteDialog(false);
      sileo.error({
        title: 'Error al eliminar',
        description: 'No se pudieron eliminar las transacciones. Intenta de nuevo.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar + Filters toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o comercio..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowFilters((prev) => !prev)}
          className="h-9 gap-1.5 text-xs"
        >
          <RiEqualizerLine className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Collapsible filters panel */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Category filter — hidden when all transactions are Balance inicial */}
            {selectableIds.length > 0 && (
              <CategoryFilterField
                categories={categories}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            )}

            {/* Date range filter */}
            <DateRangeFilter
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              preset={datePreset}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onPresetChange={setDatePreset}
            />

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1 text-xs"
              >
                <RiCloseLine className="h-3.5 w-3.5" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Count / selection strip */}
      {!isPending && transactions.length > 0 && (
        <div className="flex items-center justify-between px-1 py-1.5">
          <div className="flex items-center gap-3">
            {selectableIds.length > 0 && (
              <Checkbox
                checked={isAllSelected ? true : isAllIndeterminate ? 'indeterminate' : false}
                onCheckedChange={toggleSelectAll}
                aria-label="Seleccionar todas"
              />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {hasSelection
                ? `${selectedIds.size} seleccionada${selectedIds.size !== 1 ? 's' : ''}`
                : `${transactions.length} transaccion${transactions.length !== 1 ? 'es' : ''}${hasNextPage ? '+' : ''}`}
            </span>
          </div>
          {hasSelection && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                Deseleccionar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-7 gap-1 text-xs"
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
                Eliminar ({selectedIds.size})
              </Button>
            </div>
          )}
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
          {Array.from(dateGroups.entries()).map(([dateKey, txns]) => {
            const groupSelectableIds = txns
              .filter((tx) => !isInitialBalance(tx))
              .map((tx) => tx.id);
            const groupAllSelected =
              groupSelectableIds.length > 0 &&
              groupSelectableIds.every((id) => selectedIds.has(id));
            const groupSomeSelected =
              groupSelectableIds.some((id) => selectedIds.has(id)) && !groupAllSelected;

            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 px-1 py-2 text-xs font-semibold text-muted-foreground">
                  {groupSelectableIds.length > 0 && (
                    <Checkbox
                      checked={
                        groupAllSelected ? true : groupSomeSelected ? 'indeterminate' : false
                      }
                      onCheckedChange={() => toggleGroupSelection(groupSelectableIds)}
                      aria-label={`Seleccionar todas del ${formatDateHeader(dateKey)}`}
                    />
                  )}
                  <p className="uppercase">
                    <span>{formatDateHeader(dateKey)}</span>
                    <span className="mx-1.5">&middot;</span>
                    <span>{txns.length}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  {txns.map((tx) => {
                    const selectable = !isInitialBalance(tx);
                    return (
                      <GlobalTransactionCard
                        key={tx.id}
                        transaction={tx}
                        categoryName={categoryMap.get(tx.categoryId ?? '') ?? 'Sin categoria'}
                        isSelectable={selectable}
                        isSelected={selectable && selectedIds.has(tx.id)}
                        onToggleSelect={() => toggleSelection(tx.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`¿Eliminar ${selectedIds.size} transaccion${selectedIds.size !== 1 ? 'es' : ''}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Las transacciones seleccionadas seran eliminadas
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
