import type { RemixiconComponentType } from '@remixicon/react';
import { RiArrowRightSLine } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { Link } from '@tanstack/react-router';
import { setBreadcrumbLabel } from '@/shared/lib/useBreadcrumbStore';
import { Card, CardContent } from '@/shared/ui';
import { useProductCard } from './useProductCard';

type ProductCardProps = {
  product: ProductResponse;
  icon: RemixiconComponentType;
};

export function ProductCard({ product, icon: Icon }: ProductCardProps) {
  const {
    isNegative,
    snippet,
    formattedBalance,
    balanceUsd,
    isBalanceUsdNegative,
    usagePercent,
    creditLimitLabel,
    loanProgress,
  } = useProductCard(product);

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="block"
      viewTransition
      onClick={() => setBreadcrumbLabel(product.id, product.name)}
    >
      <Card className="ring-transparent border border-border hover:border-foreground/20 hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {product.institution !== 'N/A' ? product.institution : 'Billetera personal'}
            </p>
            {snippet && <p className="truncate text-xs text-muted-foreground mt-0.5">{snippet}</p>}
            {usagePercent !== null && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full max-w-48 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                {creditLimitLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{creditLimitLabel}</p>
                )}
              </div>
            )}
            {loanProgress !== null && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full max-w-48 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${loanProgress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loanProgress.paid} de {loanProgress.total} cuotas
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p
              className={`font-semibold tabular-nums whitespace-nowrap ${isNegative ? 'text-destructive' : ''}`}
            >
              {formattedBalance}
              {balanceUsd && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {product.currency}
                </span>
              )}
            </p>
            {balanceUsd && (
              <p
                className={`text-sm font-semibold tabular-nums ${isBalanceUsdNegative ? 'text-destructive' : ''}`}
              >
                {balanceUsd}
                <span className="ml-1 text-xs font-normal text-muted-foreground">USD</span>
              </p>
            )}
          </div>
          <RiArrowRightSLine className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
