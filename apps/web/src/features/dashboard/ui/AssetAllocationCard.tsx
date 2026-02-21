import type { Currency, ProductResponse, ProductType } from '@rumbo/shared';
import { useMemo, useState } from 'react';
import { PRODUCT_GROUPS } from '@/features/financial-products';
import { formatBalance } from '@/features/financial-products/model/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

type AssetAllocationCardProps = {
  products: ProductResponse[];
  activeCurrency: Currency;
};

type AllocationTab = 'all' | 'assets' | 'liabilities';

const LIABILITY_TYPES: ProductType[] = ['credit_card', 'loan_free_investment', 'loan_mortgage'];

const LIABILITY_GROUP_KEYS = new Set(['cards', 'loans']);

const TABS: { value: AllocationTab; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'assets', label: 'Lo que tienes' },
  { value: 'liabilities', label: 'Lo que debes' },
];

const GROUP_COLORS: Record<string, string> = {
  accounts: 'bg-blue-500',
  cards: 'bg-rose-500',
  loans: 'bg-purple-500',
  investments: 'bg-emerald-500',
  cash: 'bg-amber-400',
};

type AllocationSlice = {
  key: string;
  label: string;
  balance: number;
  percentage: number;
  color: string;
};

function isLiability(type: ProductType): boolean {
  return LIABILITY_TYPES.includes(type);
}

function getProductBalance(product: ProductResponse, currency: Currency): number | null {
  if (product.currency === currency) {
    return Number.parseFloat(product.balance);
  }

  if (currency === 'USD') {
    const meta = product.metadata as Record<string, unknown> | null;
    if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
      return Number.parseFloat(meta.balanceUsd);
    }
  }

  return null;
}

export function AssetAllocationCard({ products, activeCurrency }: AssetAllocationCardProps) {
  const [activeTab, setActiveTab] = useState<AllocationTab>('all');

  const slices = useMemo(() => {
    let entries = products
      .map((p) => ({ product: p, balance: getProductBalance(p, activeCurrency) }))
      .filter((e): e is { product: ProductResponse; balance: number } => e.balance !== null);

    if (activeTab === 'assets') {
      entries = entries.filter((e) => !isLiability(e.product.type));
    } else if (activeTab === 'liabilities') {
      entries = entries.filter((e) => isLiability(e.product.type));
    }

    const totalAbsolute = entries.reduce((sum, e) => sum + Math.abs(e.balance), 0);

    if (totalAbsolute === 0) return [];

    const groups =
      activeTab === 'assets'
        ? PRODUCT_GROUPS.filter((g) => !LIABILITY_GROUP_KEYS.has(g.key))
        : activeTab === 'liabilities'
          ? PRODUCT_GROUPS.filter((g) => LIABILITY_GROUP_KEYS.has(g.key))
          : PRODUCT_GROUPS;

    return groups
      .map((group) => {
        const groupEntries = entries.filter((e) => group.types.includes(e.product.type));
        const balance = groupEntries.reduce((sum, e) => sum + e.balance, 0);
        const percentage = (Math.abs(balance) / totalAbsolute) * 100;

        return {
          key: group.key,
          label: group.label,
          balance,
          percentage,
          color: GROUP_COLORS[group.key] ?? 'bg-gray-400',
        } satisfies AllocationSlice;
      })
      .filter((s) => s.percentage > 0);
  }, [products, activeCurrency, activeTab]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Composición financiera</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {slices.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Sin productos en {activeCurrency}</p>
          </div>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="flex h-3 overflow-hidden rounded-full">
              {slices.map((slice) => (
                <div
                  key={slice.key}
                  className={`${slice.color} transition-all duration-300`}
                  style={{ width: `${slice.percentage}%` }}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {slices.map((slice) => (
                <div key={slice.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 shrink-0 rounded-full ${slice.color}`} />
                    <span className="text-muted-foreground">{slice.label}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-xs text-muted-foreground">
                      {slice.percentage.toFixed(0)}%
                    </span>
                    <span className={`font-medium ${slice.balance < 0 ? 'text-destructive' : ''}`}>
                      {formatBalance(String(slice.balance), activeCurrency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
