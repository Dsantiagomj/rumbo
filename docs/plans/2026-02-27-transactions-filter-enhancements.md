# TransactionsPage Filter Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the TransactionsPage category filter with cascade picker and date range filter with presets + range calendar.

**Architecture:** Create new CategoryCascadePicker for parent→subcategory navigation, and DateRangeFilter with adaptive layout (mobile sheet vs desktop popover). Both use ResponsivePopover pattern already established. Add datePreset state to hook.

**Tech Stack:** React, TypeScript, react-day-picker (mode="range"), date-fns, ResponsivePopover, shadcn/ui Calendar.

---

## Task 1: Create CategoryCascadePicker Component

**Files:**
- Create: `apps/web/src/features/transactions/ui/components/CategoryCascadePicker.tsx`
- Create: `apps/web/src/features/transactions/ui/components/__tests__/CategoryCascadePicker.test.tsx`

**Step 1: Write the test**

```tsx
// apps/web/src/features/transactions/ui/components/__tests__/CategoryCascadePicker.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryCascadePicker } from '../CategoryCascadePicker';

const mockCategories = [
  { id: 'parent1', name: 'Alimentación', parentId: null, transactionCount: 10 },
  { id: 'parent2', name: 'Transporte', parentId: null, transactionCount: 5 },
  { id: 'child1', name: 'Restaurantes', parentId: 'parent1', transactionCount: 7 },
  { id: 'child2', name: 'Supermercado', parentId: 'parent1', transactionCount: 3 },
  { id: 'child3', name: 'Uber', parentId: 'parent2', transactionCount: 5 },
  { id: 'empty', name: 'Vacío', parentId: null, transactionCount: 0 },
];

describe('CategoryCascadePicker', () => {
  it('shows only parent categories initially', () => {
    render(
      <CategoryCascadePicker
        categories={mockCategories}
        value={null}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument();
    expect(screen.queryByText('Vacío')).not.toBeInTheDocument(); // 0 transactions hidden
  });

  it('shows subcategories when parent is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCascadePicker
        categories={mockCategories}
        value={null}
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByText('Alimentación'));

    expect(screen.getByText('Restaurantes')).toBeInTheDocument();
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.queryByText('Transporte')).not.toBeInTheDocument();
  });

  it('calls onChange when subcategory is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryCascadePicker
        categories={mockCategories}
        value={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByText('Alimentación'));
    await user.click(screen.getByText('Restaurantes'));

    expect(onChange).toHaveBeenCalledWith('child1');
  });

  it('shows back button in subcategory view', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCascadePicker
        categories={mockCategories}
        value={null}
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByText('Alimentación'));

    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('returns to parent view when back is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCascadePicker
        categories={mockCategories}
        value={null}
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByText('Alimentación'));
    await user.click(screen.getByRole('button', { name: /volver/i }));

    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test CategoryCascadePicker`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/src/features/transactions/ui/components/CategoryCascadePicker.tsx
'use client';

import { RiArrowLeftLine, RiArrowRightSLine, RiCheckLine } from '@remixicon/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export function CategoryCascadePicker({
  categories,
  value,
  onChange,
}: CategoryCascadePickerProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Filter out categories with 0 transactions
  const activeCategories = categories.filter((c) => c.transactionCount > 0);

  const parentCategories = activeCategories.filter((c) => c.parentId === null);
  const subcategories = selectedParentId
    ? activeCategories.filter((c) => c.parentId === selectedParentId)
    : [];

  const selectedParent = parentCategories.find((c) => c.id === selectedParentId);

  const handleParentClick = (parentId: string) => {
    const children = activeCategories.filter((c) => c.parentId === parentId);
    if (children.length > 0) {
      setSelectedParentId(parentId);
    } else {
      // No children, select directly
      onChange(parentId);
    }
  };

  const handleSubcategoryClick = (categoryId: string) => {
    onChange(categoryId);
  };

  const handleBack = () => {
    setSelectedParentId(null);
  };

  const handleClear = () => {
    onChange(null);
  };

  if (selectedParentId) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="justify-start gap-2"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          Volver
        </Button>
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {selectedParent?.name}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {subcategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                value === category.id && 'bg-accent',
              )}
              onClick={() => handleSubcategoryClick(category.id)}
            >
              <span>{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  ({category.transactionCount})
                </span>
                {value === category.id && <RiCheckLine className="h-4 w-4" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="max-h-[300px] overflow-y-auto">
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
            value === null && 'bg-accent',
          )}
          onClick={handleClear}
        >
          <span className="text-muted-foreground">Todas las categorías</span>
          {value === null && <RiCheckLine className="h-4 w-4" />}
        </button>
        <div className="my-1 h-px bg-border" />
        {parentCategories.map((category) => {
          const hasChildren = activeCategories.some((c) => c.parentId === category.id);
          return (
            <button
              key={category.id}
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                value === category.id && 'bg-accent',
              )}
              onClick={() => handleParentClick(category.id)}
            >
              <span>{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  ({category.transactionCount})
                </span>
                {hasChildren ? (
                  <RiArrowRightSLine className="h-4 w-4 text-muted-foreground" />
                ) : (
                  value === category.id && <RiCheckLine className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test CategoryCascadePicker`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/features/transactions/ui/components/CategoryCascadePicker.tsx apps/web/src/features/transactions/ui/components/__tests__/CategoryCascadePicker.test.tsx
git commit -m "feat(transactions): add CategoryCascadePicker component"
```

---

## Task 2: Create DateRangePreset Types and Utils

**Files:**
- Create: `apps/web/src/features/transactions/model/date-presets.ts`

**Step 1: Write the implementation**

```tsx
// apps/web/src/features/transactions/model/date-presets.ts
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export type DatePreset = 'week' | 'month' | '30days' | 'custom' | 'all';

export interface DateRange {
  startDate: string | undefined; // YYYY-MM-DD
  endDate: string | undefined;   // YYYY-MM-DD
}

export interface PresetOption {
  id: DatePreset;
  label: string;
}

export const DATE_PRESETS: PresetOption[] = [
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: '30days', label: 'Últimos 30 días' },
  { id: 'all', label: 'Todo' },
];

export function calculatePresetDates(preset: DatePreset): DateRange {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  switch (preset) {
    case 'week': {
      const weekStart = startOfWeek(today, { weekStartsOn: 1, locale: es });
      return {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: todayStr,
      };
    }
    case 'month': {
      const monthStart = startOfMonth(today);
      return {
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: todayStr,
      };
    }
    case '30days': {
      const thirtyDaysAgo = subDays(today, 29);
      return {
        startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
        endDate: todayStr,
      };
    }
    case 'all':
    case 'custom':
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

export function formatDateRangeDisplay(
  startDate: string | undefined,
  endDate: string | undefined,
  preset: DatePreset,
): string {
  if (preset !== 'custom' && preset !== 'all') {
    const presetOption = DATE_PRESETS.find((p) => p.id === preset);
    return presetOption?.label ?? 'Fecha';
  }

  if (!startDate && !endDate) {
    return 'Fecha';
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return format(date, 'd MMM', { locale: es });
  };

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `Desde ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `Hasta ${formatDate(endDate)}`;
  }
  return 'Fecha';
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/transactions/model/date-presets.ts
git commit -m "feat(transactions): add date preset types and utilities"
```

---

## Task 3: Create DateRangeContent Component

**Files:**
- Create: `apps/web/src/features/transactions/ui/components/DateRangeContent.tsx`
- Create: `apps/web/src/features/transactions/ui/components/__tests__/DateRangeContent.test.tsx`

**Step 1: Write the test**

```tsx
// apps/web/src/features/transactions/ui/components/__tests__/DateRangeContent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateRangeContent } from '../DateRangeContent';

describe('DateRangeContent', () => {
  it('renders all preset buttons', () => {
    render(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="all"
        onPresetChange={vi.fn()}
        onRangeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Últimos 30 días' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todo' })).toBeInTheDocument();
  });

  it('calls onPresetChange when preset is clicked', async () => {
    const user = userEvent.setup();
    const onPresetChange = vi.fn();
    render(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="all"
        onPresetChange={onPresetChange}
        onRangeChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Esta semana' }));
    expect(onPresetChange).toHaveBeenCalledWith('week');
  });

  it('highlights active preset', () => {
    render(
      <DateRangeContent
        startDate="2026-02-01"
        endDate="2026-02-27"
        preset="month"
        onPresetChange={vi.fn()}
        onRangeChange={vi.fn()}
      />
    );

    const monthButton = screen.getByRole('button', { name: 'Este mes' });
    expect(monthButton).toHaveAttribute('data-active', 'true');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test DateRangeContent`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/src/features/transactions/ui/components/DateRangeContent.tsx
'use client';

import { es } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DATE_PRESETS, type DatePreset } from '../../model/date-presets';

interface DateRangeContentProps {
  startDate: string | undefined;
  endDate: string | undefined;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onRangeChange: (start: string | undefined, end: string | undefined) => void;
}

export function DateRangeContent({
  startDate,
  endDate,
  preset,
  onPresetChange,
  onRangeChange,
}: DateRangeContentProps) {
  const fromDate = startDate ? new Date(`${startDate}T12:00:00`) : undefined;
  const toDate = endDate ? new Date(`${endDate}T12:00:00`) : undefined;

  const selectedRange: DayPickerRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined;

  const handleRangeSelect = (range: DayPickerRange | undefined) => {
    const formatDate = (date: Date | undefined) =>
      date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : undefined;

    onRangeChange(formatDate(range?.from), formatDate(range?.to));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 px-3 pt-3">
        {DATE_PRESETS.map((presetOption) => (
          <Button
            key={presetOption.id}
            variant={preset === presetOption.id ? 'default' : 'outline'}
            size="sm"
            data-active={preset === presetOption.id}
            onClick={() => onPresetChange(presetOption.id)}
          >
            {presetOption.label}
          </Button>
        ))}
      </div>

      <div className="h-px bg-border" />

      {/* Range calendar */}
      <Calendar
        mode="range"
        selected={selectedRange}
        onSelect={handleRangeSelect}
        numberOfMonths={2}
        locale={es}
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test DateRangeContent`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/features/transactions/ui/components/DateRangeContent.tsx apps/web/src/features/transactions/ui/components/__tests__/DateRangeContent.test.tsx
git commit -m "feat(transactions): add DateRangeContent component"
```

---

## Task 4: Create DateRangeFilter Component

**Files:**
- Create: `apps/web/src/features/transactions/ui/components/DateRangeFilter.tsx`

**Step 1: Write the implementation**

```tsx
// apps/web/src/features/transactions/ui/components/DateRangeFilter.tsx
'use client';

import { RiCalendarLine } from '@remixicon/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsivePopover } from '@/shared/ui';
import {
  calculatePresetDates,
  formatDateRangeDisplay,
  type DatePreset,
} from '../../model/date-presets';
import { DateRangeContent } from './DateRangeContent';

interface DateRangeFilterProps {
  startDate: string | undefined;
  endDate: string | undefined;
  preset: DatePreset;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPresetChange: (preset: DatePreset) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  preset,
  onStartDateChange,
  onEndDateChange,
  onPresetChange,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const displayText = formatDateRangeDisplay(startDate, endDate, preset);

  const handlePresetChange = (newPreset: DatePreset) => {
    const { startDate: newStart, endDate: newEnd } = calculatePresetDates(newPreset);
    onPresetChange(newPreset);
    onStartDateChange(newStart ?? '');
    onEndDateChange(newEnd ?? '');
    setOpen(false);
  };

  const handleRangeChange = (start: string | undefined, end: string | undefined) => {
    onPresetChange('custom');
    onStartDateChange(start ?? '');
    onEndDateChange(end ?? '');
    // Keep open for range selection - close on second click (when both are set)
    if (start && end) {
      setOpen(false);
    }
  };

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title="Rango de fechas"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
        >
          <RiCalendarLine className="h-3.5 w-3.5" />
          {displayText}
        </Button>
      }
    >
      <DateRangeContent
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        preset={preset}
        onPresetChange={handlePresetChange}
        onRangeChange={handleRangeChange}
      />
    </ResponsivePopover>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/transactions/ui/components/DateRangeFilter.tsx
git commit -m "feat(transactions): add DateRangeFilter component"
```

---

## Task 5: Create CategoryFilterField Component

**Files:**
- Create: `apps/web/src/features/transactions/ui/components/CategoryFilterField.tsx`

**Step 1: Write the implementation**

```tsx
// apps/web/src/features/transactions/ui/components/CategoryFilterField.tsx
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

export function CategoryFilterField({
  categories,
  value,
  onChange,
}: CategoryFilterFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = value ? categories.find((c) => c.id === value) : null;
  const displayText = selectedCategory?.name ?? 'Categoría';

  const handleChange = (categoryId: string | null) => {
    onChange(categoryId);
    setOpen(false);
  };

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title="Categoría"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
        >
          <RiPriceTag3Line className="h-3.5 w-3.5" />
          {displayText}
        </Button>
      }
    >
      <CategoryCascadePicker
        categories={categories}
        value={value}
        onChange={handleChange}
      />
    </ResponsivePopover>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/transactions/ui/components/CategoryFilterField.tsx
git commit -m "feat(transactions): add CategoryFilterField wrapper component"
```

---

## Task 6: Update useTransactionsPage Hook

**Files:**
- Modify: `apps/web/src/features/transactions/ui/useTransactionsPage.ts`

**Step 1: Update the hook**

Add `datePreset` state and integrate with existing date state:

```tsx
// apps/web/src/features/transactions/ui/useTransactionsPage.ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { listProductsQueryOptions } from '@/features/financial-products';
import { listCategoriesQueryOptions } from '@/features/financial-products/model/category-queries';
import { type GlobalTransactionFilters, globalTransactionsQueryOptions } from '../model/queries';
import { type DatePreset } from '../model/date-presets';

const ALL_SENTINEL = 'all';

export function useTransactionsPage() {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(ALL_SENTINEL);
  const [selectedType, setSelectedType] = useState<string>(ALL_SENTINEL);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');

  const filters: GlobalTransactionFilters = useMemo(
    () => ({
      search: search || undefined,
      productIds: selectedProductId !== ALL_SENTINEL ? selectedProductId : undefined,
      types: selectedType !== ALL_SENTINEL ? selectedType : undefined,
      categories: selectedCategoryId ?? undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [search, selectedProductId, selectedType, selectedCategoryId, startDate, endDate],
  );

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery(
    globalTransactionsQueryOptions(filters),
  );

  const { data: productsData } = useQuery(listProductsQueryOptions());
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.transactions) ?? [],
    [data],
  );

  const products = productsData?.products ?? [];
  const categories = categoriesData?.categories ?? [];

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData?.categories ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedProductId(ALL_SENTINEL);
    setSelectedType(ALL_SENTINEL);
    setSelectedCategoryId(null);
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  }, []);

  const hasActiveFilters = !!(
    search ||
    selectedProductId !== ALL_SENTINEL ||
    selectedType !== ALL_SENTINEL ||
    selectedCategoryId !== null ||
    startDate ||
    endDate
  );

  return {
    // Data
    transactions,
    products,
    categories,
    categoryMap,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    // Filters
    search,
    setSearch,
    selectedProductId,
    setSelectedProductId,
    selectedType,
    setSelectedType,
    selectedCategoryId,
    setSelectedCategoryId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    datePreset,
    setDatePreset,
    clearFilters,
    hasActiveFilters,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/transactions/ui/useTransactionsPage.ts
git commit -m "feat(transactions): add datePreset state to useTransactionsPage"
```

---

## Task 7: Update TransactionsPage Component

**Files:**
- Modify: `apps/web/src/features/transactions/ui/TransactionsPage.tsx`

**Step 1: Update imports and replace filters**

Replace the category Select and date inputs with new components:

```tsx
// At top of file, update imports:
import {
  RiArrowRightSLine,
  RiCloseLine,
  RiFilterLine,
  RiSearchLine,
} from '@remixicon/react';
// Remove RiPriceTag3Line from imports if present

// Add new component imports:
import { CategoryFilterField } from './components/CategoryFilterField';
import { DateRangeFilter } from './components/DateRangeFilter';

// In the component, update the destructuring from useTransactionsPage to include:
// datePreset, setDatePreset
```

**Step 2: Replace filter section (lines 183-212)**

Replace the category Select and date inputs with:

```tsx
{/* Category filter - cascade picker */}
<CategoryFilterField
  categories={categories}
  value={selectedCategoryId === 'all' ? null : selectedCategoryId}
  onChange={(id) => setSelectedCategoryId(id ?? 'all')}
/>

{/* Date range filter */}
<DateRangeFilter
  startDate={startDate || undefined}
  endDate={endDate || undefined}
  preset={datePreset}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  onPresetChange={setDatePreset}
/>
```

Remove the old:
- Category `<Select>` component (lines 183-196)
- Two date `<Input type="date">` components (lines 198-212)

**Step 3: Run typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/features/transactions/ui/TransactionsPage.tsx
git commit -m "feat(transactions): integrate cascade category picker and date range filter"
```

---

## Task 8: Add Component Exports

**Files:**
- Modify: `apps/web/src/features/transactions/ui/components/index.ts` (create if needed)

**Step 1: Create/update barrel export**

```tsx
// apps/web/src/features/transactions/ui/components/index.ts
export { CategoryCascadePicker } from './CategoryCascadePicker';
export { CategoryFilterField } from './CategoryFilterField';
export { CategoryPickerContent } from './CategoryPickerContent';
export { CategoryPickerField } from './CategoryPickerField';
export { DatePickerContent } from './DatePickerContent';
export { DatePickerField } from './DatePickerField';
export { DateRangeContent } from './DateRangeContent';
export { DateRangeFilter } from './DateRangeFilter';
```

**Step 2: Commit**

```bash
git add apps/web/src/features/transactions/ui/components/index.ts
git commit -m "chore(transactions): add barrel export for filter components"
```

---

## Task 9: Manual Testing

**Step 1: Start dev server**

Run: `cd apps/web && pnpm dev`

**Step 2: Test category cascade picker**

1. Navigate to `/transactions`
2. Click category filter button
3. Verify parent categories show with transaction counts
4. Verify categories with 0 transactions are hidden
5. Click a parent with children → verify subcategories appear
6. Click back → verify returns to parents
7. Select a subcategory → verify filter applies

**Step 3: Test date range filter**

1. Click date range button
2. Verify presets appear (Esta semana, Este mes, etc.)
3. Click "Este mes" → verify dates change, popover closes
4. Click again → verify "Este mes" is highlighted
5. Select custom range via calendar → verify dates update
6. On mobile: verify Sheet appears instead of Popover

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(transactions): complete filter enhancements"
```

---

## Summary

| Task | Description | Estimate |
|------|-------------|----------|
| 1 | CategoryCascadePicker component | 15 min |
| 2 | Date preset types and utils | 5 min |
| 3 | DateRangeContent component | 15 min |
| 4 | DateRangeFilter component | 10 min |
| 5 | CategoryFilterField component | 5 min |
| 6 | Update useTransactionsPage hook | 5 min |
| 7 | Update TransactionsPage component | 10 min |
| 8 | Add component exports | 2 min |
| 9 | Manual testing | 10 min |

**Total: ~75 minutes**
