import type { GlobalTransactionResponse } from '@rumbo/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionsPage } from '../TransactionsPage';

const mocks = vi.hoisted(() => ({
  setBreadcrumbLabel: vi.fn(),
  useTransactionsPage: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href="/mock" className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('@/shared/lib/useBreadcrumbStore', () => ({
  setBreadcrumbLabel: mocks.setBreadcrumbLabel,
}));

vi.mock('../useTransactionsPage', () => ({
  useTransactionsPage: mocks.useTransactionsPage,
}));

function createTransaction(partial: Partial<GlobalTransactionResponse>): GlobalTransactionResponse {
  return {
    id: '00000000-0000-4000-a000-000000000011',
    productId: '00000000-0000-4000-a000-000000000022',
    categoryId: null,
    transferId: null,
    type: 'expense',
    name: 'Pago Internet',
    merchant: 'ISP',
    excluded: false,
    amount: '149900',
    currency: 'COP',
    date: '2026-02-20T10:00:00.000Z',
    notes: null,
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
    productName: 'Cuenta Corriente',
    productType: 'checking',
    ...partial,
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const transaction = createTransaction({});
    mocks.useTransactionsPage.mockReturnValue({
      transactions: [transaction],
      products: [],
      categories: [],
      categoryMap: new Map<string, string>(),
      isPending: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      selectedProductId: 'all',
      setSelectedProductId: vi.fn(),
      selectedType: 'all',
      setSelectedType: vi.fn(),
      selectedCategoryId: null,
      setSelectedCategoryId: vi.fn(),
      startDate: '',
      setStartDate: vi.fn(),
      endDate: '',
      setEndDate: vi.fn(),
      datePreset: 'all',
      setDatePreset: vi.fn(),
      clearFilters: vi.fn(),
      hasActiveFilters: false,
      activeFilterCount: 0,
      showFilters: false,
      setShowFilters: vi.fn(),
      selectedIds: new Set<string>(),
      selectableIds: [],
      hasSelection: false,
      isAllSelected: false,
      isAllIndeterminate: false,
      toggleSelection: vi.fn(),
      toggleGroupSelection: vi.fn(),
      toggleSelectAll: vi.fn(),
      clearSelection: vi.fn(),
    });
  });

  it('sets transaction breadcrumb label when opening a global transaction', () => {
    renderWithProviders(<TransactionsPage />);

    fireEvent.click(screen.getByText('Pago Internet'));

    expect(mocks.setBreadcrumbLabel).toHaveBeenCalledTimes(1);
    expect(mocks.setBreadcrumbLabel).toHaveBeenCalledWith(
      '00000000-0000-4000-a000-000000000011',
      'Pago Internet',
    );
  });
});
