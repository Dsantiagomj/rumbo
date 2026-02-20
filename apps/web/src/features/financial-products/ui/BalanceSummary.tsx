import type { Currency, ProductResponse } from '@rumbo/shared';
import { useBalanceSummary } from './useBalanceSummary';

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
  const { currencies, isNegative, formattedTotal, currencyLabel } = useBalanceSummary(
    products,
    activeCurrency,
  );

  return (
    <div className="text-center md:text-left py-4">
      <p className="text-sm text-muted-foreground">Balance total</p>
      <p className={`mt-1 text-4xl font-bold tabular-nums ${isNegative ? 'text-destructive' : ''}`}>
        {formattedTotal}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{currencyLabel}</p>

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
