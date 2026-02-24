import type {
  CreateTransaction,
  TransactionListResponse,
  TransactionResponse,
  UpdateTransaction,
} from '@rumbo/shared';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export function listTransactionsQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ['transactions', productId],
    queryFn: () =>
      apiClient<TransactionListResponse>(`/api/financial-products/${productId}/transactions`),
  });
}

export function useCreateTransactionMutation(productId: string) {
  return useMutation({
    mutationFn: (data: Omit<CreateTransaction, 'productId'>) =>
      apiClient<TransactionResponse>(`/api/financial-products/${productId}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useUpdateTransactionMutation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransaction }) =>
      apiClient<TransactionResponse>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteTransactionMutation() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<TransactionResponse>(`/api/transactions/${id}`, {
        method: 'DELETE',
      }),
  });
}
