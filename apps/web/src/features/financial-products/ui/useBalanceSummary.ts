import type { Currency, ProductResponse } from '@rumbo/shared';
import { CURRENCIES } from '@rumbo/shared';
import { CURRENCY_LABELS, formatBalance } from '../model/constants';

export function useBalanceSummary(products: ProductResponse[], activeCurrency: Currency) {
  const totals = products.reduce<Partial<Record<Currency, number>>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);

    const meta = p.metadata as Record<string, unknown> | null;
    if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
      acc.USD = (acc.USD ?? 0) + Number.parseFloat(meta.balanceUsd);
    }

    return acc;
  }, {});

  const currencies = CURRENCIES;
  const total = totals[activeCurrency] ?? 0;
  const isNegative = total < 0;
  const formattedTotal = formatBalance(String(total), activeCurrency);
  const currencyLabel = CURRENCY_LABELS[activeCurrency];

  return {
    currencies,
    isNegative,
    formattedTotal,
    currencyLabel,
  };
}
