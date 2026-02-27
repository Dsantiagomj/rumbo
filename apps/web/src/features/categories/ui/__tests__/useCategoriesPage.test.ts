import type { CategoryResponse } from '@rumbo/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/client';
import { useCategoriesPage } from '../useCategoriesPage';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  invalidateQueries: vi.fn(),
  listCategoriesQueryOptions: vi.fn(() => ({ queryKey: ['categories'] })),
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
  sileoError: vi.fn(),
  sileoSuccess: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: mocks.useQuery,
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  };
});

vi.mock('@/features/financial-products/model/category-queries', () => ({
  listCategoriesQueryOptions: mocks.listCategoriesQueryOptions,
  useCreateCategoryMutation: () => ({
    mutate: mocks.createMutate,
    isPending: false,
  }),
  useUpdateCategoryMutation: () => ({
    mutate: mocks.updateMutate,
    isPending: false,
  }),
  useDeleteCategoryMutation: () => ({
    mutate: mocks.deleteMutate,
    isPending: false,
  }),
}));

vi.mock('sileo', () => ({
  sileo: {
    error: mocks.sileoError,
    success: mocks.sileoSuccess,
  },
}));

function createCategory(partial: Partial<CategoryResponse>): CategoryResponse {
  return {
    id: '00000000-0000-4000-a000-000000000001',
    userId: 'user-1',
    name: 'Category',
    parentId: null,
    isDefault: false,
    transactionCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('useCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockReturnValue({
      data: { categories: [] },
      isPending: false,
      isError: false,
    });
  });

  it('groups children by parent and initializes groups as expanded', async () => {
    const parentA = createCategory({
      id: '00000000-0000-4000-a000-000000000011',
      name: 'Ingresos',
    });
    const parentB = createCategory({
      id: '00000000-0000-4000-a000-000000000022',
      name: 'Gastos',
    });
    const childA1 = createCategory({
      id: '00000000-0000-4000-a000-000000000033',
      name: 'Salario',
      parentId: parentA.id,
    });
    const childA2 = createCategory({
      id: '00000000-0000-4000-a000-000000000044',
      name: 'Freelance',
      parentId: parentA.id,
    });
    const childB1 = createCategory({
      id: '00000000-0000-4000-a000-000000000055',
      name: 'Transporte',
      parentId: parentB.id,
    });

    mocks.useQuery.mockReturnValue({
      data: { categories: [childA2, parentA, childB1, parentB, childA1] },
      isPending: false,
      isError: false,
    });

    const { result } = renderHook(() => useCategoriesPage());

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]).toMatchObject({
      parent: { id: parentA.id, name: parentA.name },
      children: [{ id: childA2.id }, { id: childA1.id }],
    });
    expect(result.current.groups[1]).toMatchObject({
      parent: { id: parentB.id, name: parentB.name },
      children: [{ id: childB1.id }],
    });

    await waitFor(() => {
      expect(result.current.isExpanded(parentA.id)).toBe(true);
    });
    expect(result.current.isExpanded(parentB.id)).toBe(true);
  });

  it('creates a category with trimmed name and resets form on success', () => {
    const parentId = '00000000-0000-4000-a000-000000000099';
    const createdCategory = createCategory({
      id: '00000000-0000-4000-a000-000000000100',
      name: 'Comida',
      parentId,
    });
    mocks.createMutate.mockImplementation(
      (_payload: unknown, options?: { onSuccess?: (data: CategoryResponse) => void }) => {
        options?.onSuccess?.(createdCategory);
      },
    );

    const { result } = renderHook(() => useCategoriesPage());

    act(() => {
      result.current.setNewName('  Comida  ');
      result.current.setSelectedParentId(parentId);
    });

    act(() => {
      result.current.handleCreate();
    });

    expect(mocks.createMutate).toHaveBeenCalledWith(
      {
        name: 'Comida',
        parentId,
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['categories'] });
    expect(result.current.newName).toBe('');
    expect(result.current.selectedParentId).toBeNull();
    expect(mocks.sileoError).not.toHaveBeenCalled();
    expect(mocks.sileoSuccess).toHaveBeenCalledWith({ title: 'Categoría creada' });
  });

  it('shows API error message when creating a category fails', () => {
    mocks.createMutate.mockImplementation(
      (_payload: unknown, options?: { onError?: (error: unknown) => void }) => {
        options?.onError?.(new ApiError(409, 'CATEGORY_EXISTS', 'La categoría ya existe'));
      },
    );

    const { result } = renderHook(() => useCategoriesPage());

    act(() => {
      result.current.setNewName('Duplicada');
    });

    act(() => {
      result.current.handleCreate();
    });

    expect(mocks.sileoError).toHaveBeenCalledWith({
      title: 'No se pudo crear la categoría',
      description: 'La categoría ya existe',
    });
  });

  it('uses fallback message when rename fails with unknown error shape', () => {
    const category = createCategory({
      id: '00000000-0000-4000-a000-000000000077',
      name: 'Vieja',
    });
    mocks.useQuery.mockReturnValue({
      data: { categories: [category] },
      isPending: false,
      isError: false,
    });
    mocks.updateMutate.mockImplementation(
      (_payload: unknown, options?: { onError?: (error: unknown) => void }) => {
        options?.onError?.({ status: 500 });
      },
    );

    const { result } = renderHook(() => useCategoriesPage());

    act(() => {
      result.current.startEditing(category);
      result.current.setEditName('Nueva');
    });

    act(() => {
      result.current.handleRename();
    });

    expect(mocks.updateMutate).toHaveBeenCalledWith(
      {
        id: category.id,
        data: { name: 'Nueva' },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(mocks.sileoError).toHaveBeenCalledWith({
      title: 'No se pudo renombrar la categoría',
      description: 'Intenta de nuevo en unos minutos.',
    });
  });
});
