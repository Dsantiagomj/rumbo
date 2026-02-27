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
}

export function CategoryCascadePicker({ categories, value, onChange }: CategoryCascadePickerProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const visibleCategories = categories.filter((c) => c.transactionCount > 0);

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
        <div className="text-xs font-medium text-muted-foreground px-2 py-1">{parent?.name}</div>
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
      {parentCategories.map((category) => (
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
            <span className="text-xs text-muted-foreground">({category.transactionCount})</span>
            {isSelected(category.id) && <RiCheckLine className="h-4 w-4" />}
            {hasChildren(category.id) && <RiArrowRightSLine className="h-4 w-4" />}
          </span>
        </button>
      ))}
    </div>
  );
}
