import type { ProductResponse } from '@rumbo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

type ProductListResponse = {
  products: ProductResponse[];
};

export function listProductsQueryOptions() {
  return queryOptions({
    queryKey: ['financial-products'],
    queryFn: () => apiClient<ProductListResponse>('/api/financial-products'),
  });
}
