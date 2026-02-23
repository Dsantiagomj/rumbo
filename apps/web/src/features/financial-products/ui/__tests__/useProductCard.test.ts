import type { ProductResponse } from '@rumbo/shared';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProductCard } from '../useProductCard';

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

describe('useProductCard', () => {
  it('returns formatted balance for savings product', () => {
    const { result } = renderHook(() => useProductCard(baseProduct));
    expect(result.current.formattedBalance).toMatch(/4\.500\.000/);
  });

  it('returns isNegative false for positive balance', () => {
    const { result } = renderHook(() => useProductCard(baseProduct));
    expect(result.current.isNegative).toBe(false);
  });

  it('returns isNegative true for negative balance', () => {
    const product: ProductResponse = { ...baseProduct, balance: '-2300000' };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.isNegative).toBe(true);
  });

  it('returns null for usagePercent on non-credit-card products', () => {
    const { result } = renderHook(() => useProductCard(baseProduct));
    expect(result.current.usagePercent).toBeNull();
  });

  it('calculates credit card usage percent', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-1500000',
      metadata: { creditLimit: '5000000' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.usagePercent).toBe(30);
  });

  it('caps credit card usage at 100%', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-6000000',
      metadata: { creditLimit: '5000000' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.usagePercent).toBe(100);
  });

  it('returns credit limit label for credit cards', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-1000000',
      metadata: { creditLimit: '5000000' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.creditLimitLabel).toMatch(/Cupo:.*5\.000\.000/);
  });

  it('returns null for loanProgress on non-loan products', () => {
    const { result } = renderHook(() => useProductCard(baseProduct));
    expect(result.current.loanProgress).toBeNull();
  });

  it('calculates loan progress correctly', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'loan_mortgage',
      balance: '-80000000',
      metadata: { totalTerm: 120, remainingTerm: 96 },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.loanProgress).toEqual({
      paid: 24,
      total: 120,
      percent: 20,
    });
  });

  it('returns balanceUsd for cash type with metadata', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'cash',
      metadata: { balanceUsd: '1200.50' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.balanceUsd).toBe('$1,200.50');
  });

  it('returns balanceUsd for credit card with metadata', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      balance: '-500000',
      metadata: { creditLimit: '5000000', balanceUsd: '-125.50' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.balanceUsd).toBe('-$125.50');
    expect(result.current.isBalanceUsdNegative).toBe(true);
  });

  it('returns null balanceUsd for types without it', () => {
    const { result } = renderHook(() => useProductCard(baseProduct));
    expect(result.current.balanceUsd).toBeNull();
  });

  it('returns snippet from metadata', () => {
    const product: ProductResponse = {
      ...baseProduct,
      metadata: { accountNumber: '1234' },
    };
    const { result } = renderHook(() => useProductCard(product));
    expect(result.current.snippet).toBe('**** 1234');
  });
});
