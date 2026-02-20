import type { Currency, ProductResponse } from '@rumbo/shared';
import { CURRENCIES } from '@rumbo/shared';
import { CURRENCY_LABELS, formatBalance } from '../model/constants';

type BalanceSummaryProps = {
  products: ProductResponse[];
  activeCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
};

export function BalanceSummary({
  products,
  activeCurrency,
  onCurrencyChange,
}: BalanceSummaryProps) {
  const totals = products.reduce<Partial<Record<Currency, number>>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);
    return acc;
  }, {});

  const currencies = CURRENCIES;
  const total = totals[activeCurrency] ?? 0;
  const isNegative = total < 0;

  return (
    <div className="text-center md:text-left py-4">
      <p className="text-sm text-muted-foreground">Balance total</p>
      <p className={`mt-1 text-4xl font-bold tabular-nums ${isNegative ? 'text-destructive' : ''}`}>
        {formatBalance(String(total), activeCurrency)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{CURRENCY_LABELS[activeCurrency]}</p>

      {/* Currency tabs */}
      {currencies.length > 1 && (
        <div className="flex items-center justify-center md:justify-start gap-1 pt-3">
          {currencies.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onCurrencyChange(currency)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                currency === activeCurrency
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
