import type {
  BalanceHistoryResponse,
  Currency,
  GlobalTransactionListResponse,
} from '@rumbo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export function balanceHistoryQueryOptions(currency: Currency) {
  return queryOptions({
    queryKey: ['balance-history', currency],
    queryFn: () =>
      apiClient<BalanceHistoryResponse>(`/api/transactions/balance-history?currency=${currency}`),
  });
}

export function recentTransactionsQueryOptions() {
  return queryOptions({
    queryKey: ['recent-transactions'],
    queryFn: () => apiClient<GlobalTransactionListResponse>('/api/transactions?limit=5'),
  });
}

export function monthlyTransactionsQueryOptions(currency: Currency) {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = now.toISOString().slice(0, 10);
  return queryOptions({
    queryKey: ['monthly-transactions', currency, startDate],
    queryFn: () =>
      apiClient<GlobalTransactionListResponse>(
        `/api/transactions?start_date=${startDate}&end_date=${endDate}&limit=100`,
      ),
  });
}
