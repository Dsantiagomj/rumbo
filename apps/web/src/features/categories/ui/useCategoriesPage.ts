import type { CategoryResponse } from '@rumbo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  listCategoriesQueryOptions,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/features/financial-products/model/category-queries';

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
  const [initialized, setInitialized] = useState(false);

  // Group categories into parent-child hierarchy
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  const groups: CategoryGroup[] = useMemo(() => {
    return parentCategories.map((parent) => ({
      parent,
      children: categories.filter((c) => c.parentId === parent.id),
    }));
  }, [parentCategories, categories]);

  // Initialize all groups as expanded once data loads
  if (!initialized && parentCategories.length > 0) {
    setExpandedIds(new Set(parentCategories.map((p) => p.id)));
    setInitialized(true);
  }

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
        onSuccess: () => {
          setNewName('');
          setSelectedParentId(null);
          invalidateCategories();
        },
      },
    );
  }, [newName, selectedParentId, createMutation, invalidateCategories]);

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
        },
      },
    );
  }, [editingId, editName, updateMutation, invalidateCategories]);

  // Delete category
  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          invalidateCategories();
        },
      });
    },
    [deleteMutation, invalidateCategories],
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
