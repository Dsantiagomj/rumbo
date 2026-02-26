'use client';

import { RiCheckLine } from '@remixicon/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/shared/ui';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  transactionCount: number;
}

interface CategoryPickerContentProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  showTransactionCount?: boolean;
}

export function CategoryPickerContent({
  categories,
  value,
  onChange,
  showTransactionCount = false,
}: CategoryPickerContentProps) {
  const [search, setSearch] = useState('');

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-2 p-3">
      <Input
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8"
      />
      <div className="max-h-[300px] overflow-y-auto">
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
            value === null && 'bg-accent',
          )}
          onClick={() => onChange(null)}
        >
          <span className="text-muted-foreground">Sin categoria</span>
          {value === null && <RiCheckLine className="h-4 w-4" />}
        </button>
        <div className="my-1 h-px bg-border" />
        {filtered.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
              value === category.id && 'bg-accent',
            )}
            onClick={() => onChange(category.id)}
          >
            <span>{category.name}</span>
            <span className="flex items-center gap-2">
              {showTransactionCount && category.transactionCount > 0 && (
                <span className="text-xs text-muted-foreground">({category.transactionCount})</span>
              )}
              {value === category.id && <RiCheckLine className="h-4 w-4" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
