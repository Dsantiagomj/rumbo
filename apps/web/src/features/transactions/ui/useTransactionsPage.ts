import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
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
  };
}
