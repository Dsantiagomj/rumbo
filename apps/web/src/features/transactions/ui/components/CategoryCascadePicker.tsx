'use client';

import { RiArrowLeftLine, RiArrowRightSLine, RiCheckLine } from '@remixicon/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  transactionCount: number;
}

interface CategoryCascadePickerProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  /** If true, hide categories with transactionCount === 0 */
  hideEmpty?: boolean;
}

export function CategoryCascadePicker({
  categories,
  value,
  onChange,
  hideEmpty = true,
}: CategoryCascadePickerProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Get all children for a parent
  const getAllChildrenForParent = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  // Calculate total transaction count for a parent (own + children)
  const getTotalTransactionCount = (parentId: string) => {
    const parent = categories.find((c) => c.id === parentId);
    const parentCount = parent?.transactionCount ?? 0;
    const childrenCount = getAllChildrenForParent(parentId).reduce(
      (sum, child) => sum + child.transactionCount,
      0,
    );
    return parentCount + childrenCount;
  };

  // A parent is visible if total transactions (own + children) > 0
  const parentHasVisibleContent = (parentId: string) => getTotalTransactionCount(parentId) > 0;

  // Filter visible categories based on hideEmpty
  const visibleCategories = hideEmpty
    ? categories.filter((c) => {
        if (c.parentId === null) {
          // Parent: show if it has transactions OR any child has transactions
          return parentHasVisibleContent(c.id);
        }
        // Child: show if it has transactions
        return c.transactionCount > 0;
      })
    : categories;

  const parentCategories = visibleCategories.filter((c) => c.parentId === null);

  const getChildrenForParent = (parentId: string) =>
    visibleCategories.filter((c) => c.parentId === parentId);

  const hasChildren = (parentId: string) => getChildrenForParent(parentId).length > 0;

  const handleParentClick = (category: Category) => {
    if (hasChildren(category.id)) {
      setSelectedParentId(category.id);
    } else {
      onChange(category.id);
    }
  };

  const handleBackClick = () => {
    setSelectedParentId(null);
  };

  const handleSubcategoryClick = (categoryId: string) => {
    onChange(categoryId);
  };

  const isSelected = (categoryId: string) => value === categoryId;

  if (selectedParentId !== null) {
    const subcategories = getChildrenForParent(selectedParentId);
    const parent = categories.find((c) => c.id === selectedParentId);
    const parentTotalCount = getTotalTransactionCount(selectedParentId);

    return (
      <div className="flex flex-col gap-1 p-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          onClick={handleBackClick}
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <div className="my-1 h-px bg-border" />
        {/* "All parent" option - selects the parent category */}
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
            isSelected(selectedParentId) && 'bg-accent',
          )}
          onClick={() => onChange(selectedParentId)}
        >
          <span>Todas {parent?.name}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">({parentTotalCount})</span>
            {isSelected(selectedParentId) && <RiCheckLine className="h-4 w-4" />}
          </span>
        </button>
        <div className="my-1 h-px bg-border" />
        {subcategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
              isSelected(category.id) && 'bg-accent',
            )}
            onClick={() => handleSubcategoryClick(category.id)}
          >
            <span>{category.name}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">({category.transactionCount})</span>
              {isSelected(category.id) && <RiCheckLine className="h-4 w-4" />}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-3">
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
          value === null && 'bg-accent',
        )}
        onClick={() => onChange(null)}
      >
        <span className="text-muted-foreground">Todas las categorías</span>
        {value === null && <RiCheckLine className="h-4 w-4" />}
      </button>
      <div className="my-1 h-px bg-border" />
      {parentCategories.map((category) => {
        // Show total count (parent + children) for parent categories
        const totalCount = getTotalTransactionCount(category.id);
        return (
          <button
            key={category.id}
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
              isSelected(category.id) && 'bg-accent',
            )}
            onClick={() => handleParentClick(category)}
          >
            <span>{category.name}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">({totalCount})</span>
              {isSelected(category.id) && <RiCheckLine className="h-4 w-4" />}
              {hasChildren(category.id) && <RiArrowRightSLine className="h-4 w-4" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
