'use client';

import { RiPriceTag3Line } from '@remixicon/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsivePopover } from '@/shared/ui';
import { CategoryCascadePicker } from './CategoryCascadePicker';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  transactionCount: number;
}

interface CategoryFilterFieldProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
}

export function CategoryFilterField({ categories, value, onChange }: CategoryFilterFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = value ? categories.find((c) => c.id === value) : null;
  const displayText = selectedCategory?.name ?? 'Categoria';

  const handleChange = (categoryId: string | null) => {
    onChange(categoryId);
    setOpen(false);
  };

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title="Categoria"
      trigger={
        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
          <RiPriceTag3Line className="h-4 w-4" />
          {displayText}
        </Button>
      }
    >
      <CategoryCascadePicker categories={categories} value={value} onChange={handleChange} />
    </ResponsivePopover>
  );
}
