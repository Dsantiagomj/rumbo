import type { ProductResponse } from '@rumbo/shared';
import { formatBalance, getMetadataSnippet } from '../model/constants';

export function useProductCard(product: ProductResponse) {
  const balance = Number.parseFloat(product.balance);
  const isNegative = balance < 0;
  const snippet = getMetadataSnippet(product);
  const formattedBalance = formatBalance(product.balance, product.currency);

  const meta = product.metadata as Record<string, unknown> | null;
  const creditLimit =
    product.type === 'credit_card' && meta?.creditLimit
      ? Number.parseFloat(meta.creditLimit as string)
      : null;
  const usagePercent =
    creditLimit && creditLimit > 0
      ? Math.min(Math.round((Math.abs(balance) / creditLimit) * 100), 100)
      : null;

  return {
    isNegative,
    snippet,
    formattedBalance,
    usagePercent,
  };
}
