import { RiArrowDownLine, RiArrowUpLine, RiWalletLine } from '@remixicon/react';
import type { Currency, ProductResponse } from '@rumbo/shared';
import { useQuickStats } from './useQuickStats';

type QuickStatsProps = {
  products: ProductResponse[];
  currency: Currency;
};

export function QuickStats({ products, currency }: QuickStatsProps) {
  const { totalProducts, formattedAssets, formattedDebt } = useQuickStats(products, currency);

  return (
    <div className="grid grid-cols-3 gap-3 border-b px-1 pb-4">
      <div className="flex flex-col items-center gap-1">
        <RiWalletLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Productos</span>
        <span className="text-sm font-semibold">{totalProducts}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <RiArrowUpLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Patrimonio</span>
        <span className="text-sm font-semibold tabular-nums">{formattedAssets}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <RiArrowDownLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Deuda</span>
        <span className="text-sm font-semibold tabular-nums">{formattedDebt}</span>
      </div>
    </div>
  );
}
