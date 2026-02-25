import type { GlobalTransactionResponse } from '@rumbo/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecentTransactionsCard } from '../RecentTransactionsCard';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  recentTransactionsQueryOptions: vi.fn(() => ({ queryKey: ['recent-transactions'] })),
  setBreadcrumbLabel: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: mocks.useQuery,
  };
});

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

vi.mock('../model/queries', () => ({
  recentTransactionsQueryOptions: mocks.recentTransactionsQueryOptions,
}));

vi.mock('@/shared/lib/useBreadcrumbStore', () => ({
  setBreadcrumbLabel: mocks.setBreadcrumbLabel,
}));

function createTransaction(partial: Partial<GlobalTransactionResponse>): GlobalTransactionResponse {
  return {
    id: '00000000-0000-4000-a000-000000000111',
    productId: '00000000-0000-4000-a000-000000000222',
    categoryId: null,
    transferId: null,
    type: 'expense',
    name: 'Supermercado',
    merchant: 'Exito',
    excluded: false,
    amount: '85000',
    currency: 'COP',
    date: '2026-02-20T10:00:00.000Z',
    notes: null,
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
    productName: 'Tarjeta Credito',
    productType: 'credit_card',
    ...partial,
  };
}

describe('RecentTransactionsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockReturnValue({
      data: { transactions: [createTransaction({})] },
      isPending: false,
    });
  });

  it('sets transaction breadcrumb label when opening a recent transaction', () => {
    render(<RecentTransactionsCard />);

    fireEvent.click(screen.getByText('Supermercado'));

    expect(mocks.setBreadcrumbLabel).toHaveBeenCalledTimes(1);
    expect(mocks.setBreadcrumbLabel).toHaveBeenCalledWith(
      '00000000-0000-4000-a000-000000000111',
      'Supermercado',
    );
  });
});
