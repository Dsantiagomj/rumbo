import type { BulkDeleteTransactionsResponse, GlobalTransactionListResponse } from '@rumbo/shared';
import { infiniteQueryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export type GlobalTransactionFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
  types?: string;
  categories?: string;
  productIds?: string;
  amountMin?: string;
  amountMax?: string;
};

function buildQueryString(filters: GlobalTransactionFilters, cursor?: string): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  if (filters.types) params.set('types', filters.types);
  if (filters.categories) params.set('categories', filters.categories);
  if (filters.productIds) params.set('product_ids', filters.productIds);
  if (filters.amountMin) params.set('amount_min', filters.amountMin);
  if (filters.amountMax) params.set('amount_max', filters.amountMax);
  if (cursor) params.set('cursor', cursor);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useBulkDeleteTransactionsMutation() {
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient<BulkDeleteTransactionsResponse>('/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
  });
}

export function globalTransactionsQueryOptions(filters: GlobalTransactionFilters) {
  return infiniteQueryOptions({
    queryKey: ['global-transactions', filters] as const,
    queryFn: ({ pageParam }) =>
      apiClient<GlobalTransactionListResponse>(
        `/api/transactions${buildQueryString(filters, pageParam ?? undefined)}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
