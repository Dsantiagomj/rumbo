import type { CategoryResponse, CreateCategory, UpdateCategory } from '@rumbo/shared';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

type CategoryListResponse = { categories: CategoryResponse[] };

export function listCategoriesQueryOptions() {
  return queryOptions({
    queryKey: ['categories'],
    queryFn: () => apiClient<CategoryListResponse>('/api/categories'),
  });
}

export function useCreateCategoryMutation() {
  return useMutation({
    mutationFn: (data: CreateCategory) =>
      apiClient<CategoryResponse>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useUpdateCategoryMutation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategory }) =>
      apiClient<CategoryResponse>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteCategoryMutation() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<CategoryResponse>(`/api/categories/${id}`, {
        method: 'DELETE',
      }),
  });
}
