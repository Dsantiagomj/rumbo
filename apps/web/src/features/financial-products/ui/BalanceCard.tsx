import type { Currency } from '@rumbo/shared';
import { Card, CardContent } from '@/shared/ui';
import { formatBalance } from '../model/constants';

type BalanceCardProps = {
  currency: Currency;
  total: number;
  label: string;
};

export function BalanceCard({ currency, total, label }: BalanceCardProps) {
  const isNegative = total < 0;

  return (
    <Card className="ring-0 border border-border shadow-sm">
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${isNegative ? 'text-destructive' : ''}`}>
          {formatBalance(String(total), currency)}
        </p>
      </CardContent>
    </Card>
  );
}
