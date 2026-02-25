import type { CategoryResponse } from '@rumbo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sileo } from 'sileo';
import {
  listCategoriesQueryOptions,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/features/financial-products/model/category-queries';
import { ApiError } from '@/shared/api';

export type CategoryGroup = {
  parent: CategoryResponse;
  children: CategoryResponse[];
};

export function useCategoriesPage() {
  const queryClient = useQueryClient();

  // Fetch categories
  const { data, isPending, isError } = useQuery(listCategoriesQueryOptions());
  const categories = data?.categories ?? [];

  // Mutations
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  // Form state for new category
  const [newName, setNewName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Expanded parent groups
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const initializedRef = useRef(false);

  // Group categories into parent-child hierarchy
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryResponse[]>();
    for (const category of categories) {
      if (!category.parentId) continue;
      const list = map.get(category.parentId) ?? [];
      list.push(category);
      map.set(category.parentId, list);
    }
    return map;
  }, [categories]);

  const groups: CategoryGroup[] = useMemo(
    () =>
      parentCategories.map((parent) => ({
        parent,
        children: childrenByParent.get(parent.id) ?? [],
      })),
    [parentCategories, childrenByParent],
  );

  // Initialize all groups as expanded once data loads
  useEffect(() => {
    if (!initializedRef.current && parentCategories.length > 0) {
      setExpandedIds(new Set(parentCategories.map((p) => p.id)));
      initializedRef.current = true;
    }
  }, [parentCategories]);

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.message) return error.message;
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback((parentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((parentId: string) => expandedIds.has(parentId), [expandedIds]);

  // Invalidate categories query
  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

  // Create category
  const handleCreate = useCallback(() => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    createMutation.mutate(
      {
        name: trimmedName,
        parentId: selectedParentId ?? undefined,
      },
      {
        onSuccess: (data) => {
          setNewName('');
          setSelectedParentId(null);
          invalidateCategories();
          if (!data.parentId) {
            setExpandedIds((prev) => {
              const next = new Set(prev);
              next.add(data.id);
              return next;
            });
          }
          sileo.success({ title: 'Categoría creada' });
        },
        onError: (error) => {
          sileo.error({
            title: 'No se pudo crear la categoría',
            description: getErrorMessage(error, 'Intenta de nuevo en unos minutos.'),
          });
        },
      },
    );
  }, [newName, selectedParentId, createMutation, invalidateCategories, getErrorMessage]);

  // Start editing a category
  const startEditing = useCallback((category: CategoryResponse) => {
    setEditingId(category.id);
    setEditName(category.name);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  // Submit rename
  const handleRename = useCallback(() => {
    if (!editingId) return;
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    updateMutation.mutate(
      { id: editingId, data: { name: trimmedName } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditName('');
          invalidateCategories();
          sileo.success({ title: 'Categoría renombrada' });
        },
        onError: (error) => {
          sileo.error({
            title: 'No se pudo renombrar la categoría',
            description: getErrorMessage(error, 'Intenta de nuevo en unos minutos.'),
          });
        },
      },
    );
  }, [editingId, editName, updateMutation, invalidateCategories, getErrorMessage]);

  // Delete category
  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          invalidateCategories();
          sileo.success({ title: 'Categoría eliminada' });
        },
        onError: (error) => {
          sileo.error({
            title: 'No se pudo eliminar la categoría',
            description: getErrorMessage(error, 'Intenta de nuevo en unos minutos.'),
          });
        },
      });
    },
    [deleteMutation, invalidateCategories, getErrorMessage],
  );

  return {
    // Data
    groups,
    parentCategories,
    isPending,
    isError,

    // Create form
    newName,
    setNewName,
    selectedParentId,
    setSelectedParentId,
    handleCreate,
    isCreating: createMutation.isPending,

    // Edit
    editingId,
    editName,
    setEditName,
    startEditing,
    cancelEditing,
    handleRename,
    isRenaming: updateMutation.isPending,

    // Delete
    handleDelete,
    isDeleting: deleteMutation.isPending,

    // Expand/collapse
    toggleExpanded,
    isExpanded,
  };
}
