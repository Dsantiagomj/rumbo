import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppLayout } from '../useAppLayout';

const mocks = vi.hoisted(() => ({
  useLocation: vi.fn(),
  useNavigate: vi.fn(),
  useRouteContext: vi.fn(),
  useRouterState: vi.fn(),
  useBreadcrumbLabels: vi.fn(),
  useLocalStorage: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useLocation: mocks.useLocation,
  useNavigate: mocks.useNavigate,
  useRouteContext: mocks.useRouteContext,
  useRouterState: mocks.useRouterState,
}));

vi.mock('@/shared/api', () => ({
  authClient: {
    signOut: mocks.signOut,
  },
}));

vi.mock('@/shared/lib/useBreadcrumbStore', () => ({
  useBreadcrumbLabels: mocks.useBreadcrumbLabels,
}));

vi.mock('@/shared/lib/useLocalStorage', () => ({
  useLocalStorage: mocks.useLocalStorage,
}));

function mockRouterState(pathname: string, search?: { from?: string }) {
  const state = {
    resolvedLocation: {
      pathname,
      search,
    },
  };
  mocks.useLocation.mockReturnValue({ pathname });
  mocks.useRouterState.mockImplementation(({ select }: { select: (s: unknown) => unknown }) =>
    select(state),
  );
}

describe('useAppLayout breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useNavigate.mockReturnValue(vi.fn());
    mocks.useRouteContext.mockReturnValue({
      user: { name: 'Daniel Munoz', email: 'daniel@example.com' },
    });
    mocks.useLocalStorage.mockImplementation((_key: string, fallback: unknown) => [
      fallback,
      vi.fn(),
    ]);
  });

  it('shows contextual breadcrumb when arriving from global transactions', () => {
    mockRouterState('/products/product-1/transactions/tx-1', { from: 'transactions' });
    mocks.useBreadcrumbLabels.mockReturnValue({
      'tx-1': 'Pago Internet',
      'product-1': 'Cuenta Corriente',
    });

    const { result } = renderHook(() => useAppLayout());

    expect(result.current.breadcrumbs).toEqual([
      { label: 'Dashboard', path: '/' },
      { label: 'Transacciones', path: '/transactions' },
      { label: 'Pago Internet', path: '/products/product-1/transactions/tx-1' },
    ]);
  });

  it('shows loading breadcrumb while transaction label is unresolved in contextual mode', () => {
    mockRouterState('/products/product-1/transactions/tx-1', { from: 'transactions' });
    mocks.useBreadcrumbLabels.mockReturnValue({});

    const { result } = renderHook(() => useAppLayout());

    expect(result.current.breadcrumbs).toEqual([
      { label: 'Dashboard', path: '/' },
      { label: 'Transacciones', path: '/transactions' },
      { label: '', path: '/products/product-1/transactions/tx-1', loading: true },
    ]);
  });

  it('falls back to default breadcrumb hierarchy when from is absent', () => {
    mockRouterState('/products/product-1/transactions/tx-1');
    mocks.useBreadcrumbLabels.mockReturnValue({
      'tx-1': 'Pago Internet',
      'product-1': 'Cuenta Corriente',
    });

    const { result } = renderHook(() => useAppLayout());

    expect(result.current.breadcrumbs).toEqual([
      { label: 'Dashboard', path: '/' },
      { label: 'Productos', path: '/products' },
      { label: 'Cuenta Corriente', path: '/products/product-1' },
      { label: 'Pago Internet', path: '/products/product-1/transactions/tx-1' },
    ]);
  });
});
