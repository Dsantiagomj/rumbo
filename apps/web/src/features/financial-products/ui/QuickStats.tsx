import { RiArrowDownLine, RiArrowUpLine, RiWalletLine } from '@remixicon/react';
import type { Currency, ProductResponse } from '@rumbo/shared';
import { useMemo } from 'react';
import { formatBalance } from '../model/constants';

type QuickStatsProps = {
  products: ProductResponse[];
  currency: Currency;
};

export function QuickStats({ products, currency }: QuickStatsProps) {
  const stats = useMemo(() => {
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
      assets: formatBalance(String(assets), currency),
      debt: formatBalance(String(debt), currency),
    };
  }, [products, currency]);

  return (
    <div className="grid grid-cols-3 gap-3 border-b px-1 pb-4">
      <div className="flex flex-col items-center gap-1">
        <RiWalletLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Productos</span>
        <span className="text-sm font-semibold">{stats.totalProducts}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <RiArrowUpLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Patrimonio</span>
        <span className="text-sm font-semibold tabular-nums">{stats.assets}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <RiArrowDownLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Deuda</span>
        <span className="text-sm font-semibold tabular-nums">{stats.debt}</span>
      </div>
    </div>
  );
}
