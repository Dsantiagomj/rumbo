import { RiBankLine } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from '../ProductCard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    to?: string;
    params?: Record<string, string>;
  }) => (
    <a href="/mock" className={className}>
      {children}
    </a>
  ),
}));

const baseProduct: ProductResponse = {
  id: '00000000-0000-4000-a000-000000000001',
  userId: 'user-1',
  type: 'savings',
  name: 'Bancolombia Ahorro',
  institution: 'Bancolombia',
  balance: '4500000',
  currency: 'COP',
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={baseProduct} icon={RiBankLine} />);
    expect(screen.getByText('Bancolombia Ahorro')).toBeInTheDocument();
  });

  it('renders institution name', () => {
    render(<ProductCard product={baseProduct} icon={RiBankLine} />);
    expect(screen.getByText('Bancolombia')).toBeInTheDocument();
  });

  it('renders formatted balance', () => {
    render(<ProductCard product={baseProduct} icon={RiBankLine} />);
    expect(screen.getByText(/4\.500\.000/)).toBeInTheDocument();
  });

  it('shows "Billetera personal" when institution is N/A', () => {
    const product: ProductResponse = { ...baseProduct, institution: 'N/A' };
    render(<ProductCard product={product} icon={RiBankLine} />);
    expect(screen.getByText('Billetera personal')).toBeInTheDocument();
  });

  it('applies destructive class for negative balance', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-2300000',
    };
    render(<ProductCard product={product} icon={RiBankLine} />);
    const balanceEl = screen.getByText(/2\.300\.000/);
    expect(balanceEl.className).toContain('text-destructive');
  });

  it('does not apply destructive class for positive balance', () => {
    render(<ProductCard product={baseProduct} icon={RiBankLine} />);
    const balanceEl = screen.getByText(/4\.500\.000/);
    expect(balanceEl.className).not.toContain('text-destructive');
  });

  it('renders metadata snippet when available', () => {
    const product: ProductResponse = {
      ...baseProduct,
      metadata: { accountNumber: '9876' },
    };
    render(<ProductCard product={product} icon={RiBankLine} />);
    expect(screen.getByText('**** 9876')).toBeInTheDocument();
  });

  it('does not render snippet when metadata is null', () => {
    render(<ProductCard product={baseProduct} icon={RiBankLine} />);
    expect(screen.queryByText(/\*\*\*\*/)).not.toBeInTheDocument();
  });

  it('renders credit card usage bar', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-1500000',
      metadata: { creditLimit: '5000000' },
    };
    render(<ProductCard product={product} icon={RiBankLine} />);
    expect(screen.getByText(/Cupo:.*5\.000\.000/)).toBeInTheDocument();
  });

  it('renders loan progress bar', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'loan_mortgage',
      balance: '-80000000',
      metadata: { totalTerm: 120, remainingTerm: 96 },
    };
    render(<ProductCard product={product} icon={RiBankLine} />);
    expect(screen.getByText('24 de 120 cuotas')).toBeInTheDocument();
  });

  it('renders dual currency display when balanceUsd is present', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'cash',
      metadata: { balanceUsd: '1200.50' },
    };
    render(<ProductCard product={product} icon={RiBankLine} />);
    expect(screen.getByText('$1,200.50')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });
});
