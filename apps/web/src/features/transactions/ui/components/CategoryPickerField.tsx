'use client';

import { RiArrowDownSLine } from '@remixicon/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsivePopover } from '@/shared/ui';
import { CategoryPickerContent } from './CategoryPickerContent';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  transactionCount: number;
}

interface CategoryPickerFieldProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  id?: string;
}

export function CategoryPickerField({ categories, value, onChange, id }: CategoryPickerFieldProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  // Parent categories (no parentId)
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  // Find selected parent (either directly selected or parent of selected subcategory)
  const selectedCategory = categories.find((c) => c.id === value);
  const selectedParentId = selectedCategory?.parentId ?? value;
  const selectedParent = parentCategories.find((c) => c.id === selectedParentId);

  // Subcategories with transactions for selected parent
  const subcategories = useMemo(() => {
    if (!selectedParentId) return [];
    return categories.filter((c) => c.parentId === selectedParentId && c.transactionCount > 0);
  }, [categories, selectedParentId]);

  const showSubcategoryPicker = subcategories.length > 0;

  const handleParentChange = (categoryId: string | null) => {
    onChange(categoryId);
    setCategoryOpen(false);
  };

  const handleSubcategoryChange = (categoryId: string | null) => {
    // If null, revert to parent category
    onChange(categoryId ?? selectedParentId);
    setSubcategoryOpen(false);
  };

  const parentDisplayValue = selectedParent?.name ?? 'Seleccionar categoria';
  const subcategoryDisplayValue =
    selectedCategory?.parentId && selectedCategory?.name
      ? selectedCategory.name
      : 'Opcional - seleccionar';

  return (
    <div className="flex flex-col gap-2">
      {/* Parent Category Picker */}
      <ResponsivePopover
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        title="Categoria"
        trigger={
          <Button id={id} variant="outline" className="w-full justify-between font-normal">
            {parentDisplayValue}
            <RiArrowDownSLine className="h-4 w-4 opacity-50" />
          </Button>
        }
      >
        <CategoryPickerContent
          categories={parentCategories}
          value={selectedParentId}
          onChange={handleParentChange}
          showTransactionCount
        />
      </ResponsivePopover>

      {/* Subcategory Picker (conditional) */}
      {showSubcategoryPicker && (
        <ResponsivePopover
          open={subcategoryOpen}
          onOpenChange={setSubcategoryOpen}
          title="Subcategoria"
          trigger={
            <Button variant="outline" className="w-full justify-between font-normal">
              {subcategoryDisplayValue}
              <RiArrowDownSLine className="h-4 w-4 opacity-50" />
            </Button>
          }
        >
          <CategoryPickerContent
            categories={subcategories}
            value={selectedCategory?.parentId ? value : null}
            onChange={handleSubcategoryChange}
          />
        </ResponsivePopover>
      )}
    </div>
  );
}
