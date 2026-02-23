import type { ProductResponse } from '@rumbo/shared';
import { describe, expect, it } from 'vitest';
import { formatBalance, getMetadataSnippet } from '../constants';

describe('formatBalance', () => {
  it('formats COP without decimals using dot separator', () => {
    expect(formatBalance('4500000', 'COP')).toMatch(/4\.500\.000/);
  });

  it('formats USD with 2 decimals using comma separator', () => {
    expect(formatBalance('1234.56', 'USD')).toBe('$1,234.56');
  });

  it('formats negative COP balance', () => {
    const result = formatBalance('-2300000', 'COP');
    expect(result).toMatch(/2\.300\.000/);
    expect(result).toMatch(/-/);
  });

  it('formats zero COP', () => {
    const result = formatBalance('0', 'COP');
    expect(result).toMatch(/0/);
  });

  it('formats zero USD', () => {
    expect(formatBalance('0', 'USD')).toBe('$0.00');
  });

  it('formats large COP amounts', () => {
    expect(formatBalance('150000000', 'COP')).toMatch(/150\.000\.000/);
  });
});

const baseProduct: ProductResponse = {
  id: '00000000-0000-4000-a000-000000000001',
  userId: 'user-1',
  type: 'savings',
  name: 'Test Product',
  institution: 'Test Bank',
  balance: '1000000',
  currency: 'COP',
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('getMetadataSnippet', () => {
  it('returns null when metadata is null', () => {
    expect(getMetadataSnippet(baseProduct)).toBeNull();
  });

  it('returns last 4 digits for credit cards', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      metadata: { last4Digits: '1234' },
    };
    expect(getMetadataSnippet(product)).toBe('**** 1234');
  });

  it('returns account number for savings accounts', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'savings',
      metadata: { accountNumber: '5678' },
    };
    expect(getMetadataSnippet(product)).toBe('**** 5678');
  });

  it('returns account number for checking accounts', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'checking',
      metadata: { accountNumber: '9012' },
    };
    expect(getMetadataSnippet(product)).toBe('**** 9012');
  });

  it('returns monthly payment for loans', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'loan_mortgage',
      metadata: { monthlyPayment: '1500000' },
    };
    const result = getMetadataSnippet(product);
    expect(result).toMatch(/^Cuota:.*\/mes$/);
    expect(result).toMatch(/1\.500\.000/);
  });

  it('returns maturity date for CDTs', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'investment_cdt',
      metadata: { maturityDate: '2026-12-31' },
    };
    expect(getMetadataSnippet(product)).toBe('Vence: 2026-12-31');
  });

  it('returns null for credit card without last4Digits', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'credit_card',
      metadata: { creditLimit: '5000000' },
    };
    expect(getMetadataSnippet(product)).toBeNull();
  });

  it('returns null for unknown product types', () => {
    const product: ProductResponse = {
      ...baseProduct,
      type: 'investment_fund',
      metadata: { broker: 'Tyba' },
    };
    expect(getMetadataSnippet(product)).toBeNull();
  });
});
