import type { CategoryResponse } from '@rumbo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

type CategoryListResponse = { categories: CategoryResponse[] };

export function listCategoriesQueryOptions() {
  return queryOptions({
    queryKey: ['categories'],
    queryFn: () => apiClient<CategoryListResponse>('/api/categories'),
  });
}
