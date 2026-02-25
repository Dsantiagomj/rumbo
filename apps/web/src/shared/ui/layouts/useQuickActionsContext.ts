import { useLocation } from '@tanstack/react-router';

export type QuickActionsMode = 'dropdown' | 'transaction-only' | 'product-only';

export function useQuickActionsContext(): QuickActionsMode {
  const { pathname } = useLocation();

  if (pathname.startsWith('/products')) {
    return 'transaction-only';
  }

  if (pathname.startsWith('/transactions')) {
    return 'product-only';
  }

  return 'dropdown';
}
