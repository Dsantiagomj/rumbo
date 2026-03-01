import type { CreateTransferResponse, TrmRateResponse } from '@rumbo/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export function trmQueryOptions() {
  return queryOptions({
    queryKey: ['trm', 'current'],
    queryFn: () => apiClient<TrmRateResponse>('/api/trm/current'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

type CreateTransferPayload = {
  sourceProductId: string;
  destinationProductId: string;
  amount: string;
  currency: string;
  date: string;
  notes?: string | null;
  exchangeRate?: string;
};

export function useCreateTransferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferPayload) =>
      apiClient<CreateTransferResponse>('/api/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
