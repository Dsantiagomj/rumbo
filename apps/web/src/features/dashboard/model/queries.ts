import type { BalanceHistoryResponse, Currency } from '@rumbo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export function balanceHistoryQueryOptions(currency: Currency) {
  return queryOptions({
    queryKey: ['balance-history', currency],
    queryFn: () =>
      apiClient<BalanceHistoryResponse>(`/api/transactions/balance-history?currency=${currency}`),
  });
}
