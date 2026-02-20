import type { Currency, ProductResponse } from '@rumbo/shared';
import { useMemo } from 'react';
import { formatBalance } from '../model/constants';

export function useQuickStats(products: ProductResponse[], currency: Currency) {
  return useMemo(() => {
    const { assets, debt } = products.reduce(
      (acc, p) => {
        if (p.currency !== currency) return acc;

        const value = Number.parseFloat(p.balance);
        if (value >= 0) {
          acc.assets += value;
        } else {
          acc.debt += Math.abs(value);
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
