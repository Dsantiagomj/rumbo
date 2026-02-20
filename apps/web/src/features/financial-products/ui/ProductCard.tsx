import type { RemixiconComponentType } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { Card, CardContent } from '@/shared/ui';
import { formatBalance } from '../model/constants';

type ProductCardProps = {
  product: ProductResponse;
  icon: RemixiconComponentType;
};

export function ProductCard({ product, icon: Icon }: ProductCardProps) {
  const balance = Number.parseFloat(product.balance);
  const isNegative = balance < 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <p className="truncate text-sm text-muted-foreground">{product.institution}</p>
        </div>
        <p className={`font-semibold tabular-nums ${isNegative ? 'text-destructive' : ''}`}>
          {formatBalance(product.balance, product.currency)}
        </p>
      </CardContent>
    </Card>
  );
}
