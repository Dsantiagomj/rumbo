import type { Currency, ProductResponse } from '@rumbo/shared';
import { useMemo } from 'react';
import { formatBalance } from '../model/constants';

export function useQuickStats(products: ProductResponse[], currency: Currency) {
  return useMemo(() => {
    const { assets, debt } = products.reduce(
      (acc, p) => {
        if (p.currency === currency) {
          const value = Number.parseFloat(p.balance);
          if (value >= 0) {
            acc.assets += value;
          } else {
            acc.debt += Math.abs(value);
          }
        }

        if (currency === 'USD') {
          const meta = p.metadata as Record<string, unknown> | null;
          if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
            const usdValue = Number.parseFloat(meta.balanceUsd);
            if (usdValue >= 0) {
              acc.assets += usdValue;
            } else {
              acc.debt += Math.abs(usdValue);
            }
          }
        }

        return acc;
      },
      { assets: 0, debt: 0 },
    );

    return {
      totalProducts: products.length,
      formattedAssets: formatBalance(String(assets), currency),
      formattedDebt: formatBalance(String(debt), currency),
    };
  }, [products, currency]);
}
