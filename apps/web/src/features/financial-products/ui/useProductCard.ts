import type { ProductResponse } from '@rumbo/shared';
import { formatBalance, getMetadataSnippet } from '../model/constants';

export function useProductCard(product: ProductResponse) {
  const balance = Number.parseFloat(product.balance);
  const isNegative = balance < 0;
  const snippet = getMetadataSnippet(product);
  const formattedBalance = formatBalance(product.balance, product.currency);

  const meta = product.metadata as Record<string, unknown> | null;
  const rawBalanceUsd =
    (product.type === 'cash' || product.type === 'credit_card') &&
    meta?.balanceUsd &&
    typeof meta.balanceUsd === 'string'
      ? meta.balanceUsd
      : null;
  const balanceUsd = rawBalanceUsd ? formatBalance(rawBalanceUsd, 'USD') : null;
  const isBalanceUsdNegative = rawBalanceUsd ? Number.parseFloat(rawBalanceUsd) < 0 : false;

  const creditLimit =
    product.type === 'credit_card' && meta?.creditLimit
      ? Number.parseFloat(meta.creditLimit as string)
      : null;
  const usagePercent =
    creditLimit && creditLimit > 0
      ? Math.min(Math.round((Math.abs(balance) / creditLimit) * 100), 100)
      : null;
  const creditLimitLabel =
    creditLimit && creditLimit > 0
      ? `Cupo: ${formatBalance(String(creditLimit), product.currency)}`
      : null;

  const isLoan = product.type === 'loan_free_investment' || product.type === 'loan_mortgage';
  const totalTerm =
    isLoan && meta?.totalTerm && typeof meta.totalTerm === 'number' ? meta.totalTerm : null;
  const remainingTerm =
    isLoan && meta?.remainingTerm && typeof meta.remainingTerm === 'number'
      ? meta.remainingTerm
      : null;
  const loanProgress =
    totalTerm && totalTerm > 0 && remainingTerm !== null
      ? {
          paid: Math.max(totalTerm - remainingTerm, 0),
          total: totalTerm,
          percent: Math.min(
            Math.max(Math.round(((totalTerm - remainingTerm) / totalTerm) * 100), 0),
            100,
          ),
        }
      : null;

  return {
    isNegative,
    snippet,
    formattedBalance,
    balanceUsd,
    isBalanceUsdNegative,
    usagePercent,
    creditLimitLabel,
    loanProgress,
  };
}
