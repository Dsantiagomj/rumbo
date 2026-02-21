import type { CreateProduct, ProductResponse } from '@rumbo/shared';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

type ProductListResponse = { products: ProductResponse[] };

export function listProductsQueryOptions() {
  return queryOptions({
    queryKey: ['financial-products'],
    queryFn: () => apiClient<ProductListResponse>('/api/financial-products'),
  });
}

export function useCreateProductMutation() {
  return useMutation({
    mutationFn: (data: CreateProduct) =>
      apiClient<ProductResponse>('/api/financial-products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
