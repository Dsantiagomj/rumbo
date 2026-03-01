import { isInitialBalance } from '@rumbo/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listProductsQueryOptions } from '@/features/financial-products';
import { listCategoriesQueryOptions } from '@/features/financial-products/model/category-queries';
import type { DatePreset } from '../model/date-presets';
import { type GlobalTransactionFilters, globalTransactionsQueryOptions } from '../model/queries';

const ALL_SENTINEL = 'all';

export function useTransactionsPage() {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(ALL_SENTINEL);
  const [selectedType, setSelectedType] = useState<string>(ALL_SENTINEL);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filters: GlobalTransactionFilters = useMemo(
    () => ({
      search: search || undefined,
      productIds: selectedProductId !== ALL_SENTINEL ? selectedProductId : undefined,
      types: selectedType !== ALL_SENTINEL ? selectedType : undefined,
      categories: selectedCategoryId ?? undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [search, selectedProductId, selectedType, selectedCategoryId, startDate, endDate],
  );

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery(
    globalTransactionsQueryOptions(filters),
  );

  const { data: productsData } = useQuery(listProductsQueryOptions());
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.transactions) ?? [],
    [data],
  );

  const products = productsData?.products ?? [];
  const categories = categoriesData?.categories ?? [];

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData?.categories ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  // --- Selection state ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectableIds = useMemo(
    () => transactions.filter((tx) => !isInitialBalance(tx)).map((tx) => tx.id),
    [transactions],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroupSelection = useCallback((groupSelectableIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = groupSelectableIds.every((id) => prev.has(id));
      if (allSelected) {
        for (const id of groupSelectableIds) next.delete(id);
      } else {
        for (const id of groupSelectableIds) next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      return allSelected ? new Set<string>() : new Set(selectableIds);
    });
  }, [selectableIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const hasSelection = selectedIds.size > 0;
  const isAllSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const isAllIndeterminate = hasSelection && !isAllSelected;

  // Auto-clear selection when filters change
  const filtersRef = useRef(filters);
  useEffect(() => {
    if (filtersRef.current !== filters) {
      filtersRef.current = filters;
      clearSelection();
    }
  }, [filters, clearSelection]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedProductId(ALL_SENTINEL);
    setSelectedType(ALL_SENTINEL);
    setSelectedCategoryId(null);
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  }, []);

  const hasActiveFilters = !!(
    search ||
    selectedProductId !== ALL_SENTINEL ||
    selectedType !== ALL_SENTINEL ||
    selectedCategoryId !== null ||
    startDate ||
    endDate
  );

  const activeFilterCount = [
    selectedProductId !== ALL_SENTINEL,
    selectedType !== ALL_SENTINEL,
    selectedCategoryId !== null,
    startDate || endDate,
  ].filter(Boolean).length;

  return {
    // Data
    transactions,
    products,
    categories,
    categoryMap,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    // Filters
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
  };
}
