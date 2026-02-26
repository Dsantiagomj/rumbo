import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuickActionsContext } from '../useQuickActionsContext';

const mocks = vi.hoisted(() => ({
  useLocation: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useLocation: mocks.useLocation,
}));

describe('useQuickActionsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns dropdown mode for dashboard', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('dropdown');
  });

  it('returns dropdown mode for settings', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/settings' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('dropdown');
  });

  it('returns transaction-only mode for /products', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/products' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('transaction-only');
  });

  it('returns transaction-only mode for /products/:id', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/products/abc-123' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('transaction-only');
  });

  it('returns transaction-only mode for /products/:id/transactions/new', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/products/abc-123/transactions/new' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('transaction-only');
  });

  it('returns product-only mode for /transactions', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/transactions' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('product-only');
  });

  it('returns dropdown mode for /transactions/new (creation route)', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/transactions/new' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('dropdown');
  });

  it('returns dropdown mode for /products/new (creation route)', () => {
    mocks.useLocation.mockReturnValue({ pathname: '/products/new' });
    const { result } = renderHook(() => useQuickActionsContext());
    expect(result.current).toBe('dropdown');
  });
});
