import type { Currency, ProductResponse } from '@rumbo/shared';
import { CURRENCIES } from '@rumbo/shared';
import { Card, CardContent } from '@/shared/ui';
import { formatBalance } from '../model/constants';

type BalanceSummaryProps = {
  products: ProductResponse[];
};

export function BalanceSummary({ products }: BalanceSummaryProps) {
  const totals = products.reduce<Partial<Record<Currency, number>>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);
    return acc;
  }, {});

  const currencies = CURRENCIES.filter((currency) => totals[currency] !== undefined);
  if (currencies.length === 0) return null;

  return (
    <div className={currencies.length > 1 ? 'grid gap-4 sm:grid-cols-2' : ''}>
      {currencies.map((currency) => {
        const total = totals[currency] ?? 0;
        const isNegative = total < 0;
        return (
          <Card key={currency}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Balance total {currency}</p>
              <p
                className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-destructive' : ''}`}
              >
                {formatBalance(String(total), currency)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
