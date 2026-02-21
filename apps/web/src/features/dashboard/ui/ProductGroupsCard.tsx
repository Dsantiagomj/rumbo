import { RiArrowRightLine } from '@remixicon/react';
import type { Currency, ProductResponse } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { PRODUCT_GROUPS } from '@/features/financial-products';
import { formatBalance } from '@/features/financial-products/model/constants';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui';

type ProductGroupsCardProps = {
  products: ProductResponse[];
};

type GroupSubtotal = { currency: Currency; total: number };

function computeGroupSubtotals(items: ProductResponse[]): GroupSubtotal[] {
  const map = items.reduce<Partial<Record<Currency, number>>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);

    const meta = p.metadata as Record<string, unknown> | null;
    if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
      acc.USD = (acc.USD ?? 0) + Number.parseFloat(meta.balanceUsd);
    }

    return acc;
  }, {});

  return (Object.entries(map) as [Currency, number][]).map(([currency, total]) => ({
    currency,
    total,
  }));
}

export function ProductGroupsCard({ products }: ProductGroupsCardProps) {
  const groups = useMemo(() => {
    return PRODUCT_GROUPS.map((group) => {
      const items = products.filter((p) => group.types.includes(p.type));
      const subtotals = computeGroupSubtotals(items);

      return { ...group, count: items.length, subtotals };
    }).filter((g) => g.count > 0);
  }, [products]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Tus productos</CardTitle>
        <CardAction>
          <Link
            to="/products"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver detalle
            <RiArrowRightLine className="size-3" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {group.label} ({group.count})
                </span>
              </div>
              <span className="font-medium tabular-nums">
                {group.subtotals.map((s, i) => (
                  <span key={s.currency}>
                    {i > 0 && ' · '}
                    <span className={s.total < 0 ? 'text-destructive' : ''}>
                      {formatBalance(String(s.total), s.currency)}
                    </span>
                    {group.subtotals.length > 1 && (
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {s.currency}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
