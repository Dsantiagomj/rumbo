import type { ProductResponse } from '@rumbo/shared';
import { Card, CardContent } from '@/shared/ui';
import { formatBalance } from '../model/constants';

type BalanceSummaryProps = {
  products: ProductResponse[];
};

export function BalanceSummary({ products }: BalanceSummaryProps) {
  const totals = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);
    return acc;
  }, {});

  const currencies = Object.entries(totals);
  if (currencies.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {currencies.map(([currency, total]) => (
        <Card key={currency}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Balance total {currency}</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatBalance(String(total), currency as 'COP' | 'USD')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
