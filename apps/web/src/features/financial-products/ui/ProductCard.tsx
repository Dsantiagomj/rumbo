import type { RemixiconComponentType } from '@remixicon/react';
import { RiArrowRightSLine } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { Card, CardContent } from '@/shared/ui';
import { formatBalance, getMetadataSnippet } from '../model/constants';

type ProductCardProps = {
  product: ProductResponse;
  icon: RemixiconComponentType;
};

export function ProductCard({ product, icon: Icon }: ProductCardProps) {
  const balance = Number.parseFloat(product.balance);
  const isNegative = balance < 0;
  const snippet = getMetadataSnippet(product);

  const meta = product.metadata as Record<string, unknown> | null;
  const creditLimit =
    product.type === 'credit_card' && meta?.creditLimit
      ? Number.parseFloat(meta.creditLimit as string)
      : null;
  const usagePercent =
    creditLimit && creditLimit > 0
      ? Math.min(Math.round((Math.abs(balance) / creditLimit) * 100), 100)
      : null;

  return (
    <Card className="ring-0 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <p className="truncate text-sm text-muted-foreground">{product.institution}</p>
          {snippet && <p className="truncate text-xs text-muted-foreground mt-0.5">{snippet}</p>}
          {usagePercent !== null && (
            <div className="mt-1.5 h-1.5 w-full max-w-48 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>
        <p
          className={`font-semibold tabular-nums whitespace-nowrap ${isNegative ? 'text-destructive' : ''}`}
        >
          {formatBalance(product.balance, product.currency)}
        </p>
        <RiArrowRightSLine className="h-5 w-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
