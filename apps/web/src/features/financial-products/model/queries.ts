import type { CreateProduct, ProductResponse, UpdateProduct } from '@rumbo/shared';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

type ProductListResponse = { products: ProductResponse[] };

export function listProductsQueryOptions() {
  return queryOptions({
    queryKey: ['financial-products'],
    queryFn: () => apiClient<ProductListResponse>('/api/financial-products'),
  });
}

export function getProductQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ['financial-products', productId],
    queryFn: () => apiClient<ProductResponse>(`/api/financial-products/${productId}`),
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

export function useUpdateProductMutation(productId: string) {
  return useMutation({
    mutationFn: (data: UpdateProduct) =>
      apiClient<ProductResponse>(`/api/financial-products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteProductMutation(productId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<{ success: boolean }>(`/api/financial-products/${productId}`, {
        method: 'DELETE',
      }),
  });
}
