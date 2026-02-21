import { RiArrowRightLine } from '@remixicon/react';
import type { Currency, ProductResponse } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { PRODUCT_GROUPS } from '@/features/financial-products';
import { formatBalance } from '@/features/financial-products/model/constants';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui';

type ProductGroupsCardProps = {
  products: ProductResponse[];
  activeCurrency: Currency;
};

export function ProductGroupsCard({ products, activeCurrency }: ProductGroupsCardProps) {
  const groups = useMemo(() => {
    return PRODUCT_GROUPS.map((group) => {
      const items = products.filter((p) => group.types.includes(p.type));
      const subtotal = items
        .filter((p) => p.currency === activeCurrency)
        .reduce((sum, p) => sum + Number.parseFloat(p.balance), 0);

      return { ...group, count: items.length, subtotal };
    }).filter((g) => g.count > 0);
  }, [products, activeCurrency]);

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
              <span
                className={`font-medium tabular-nums ${group.subtotal < 0 ? 'text-destructive' : ''}`}
              >
                {formatBalance(String(group.subtotal), activeCurrency)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
