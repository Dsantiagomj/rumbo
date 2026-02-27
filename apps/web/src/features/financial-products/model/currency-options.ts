import {
  type CreditCardMetadata,
  type Currency,
  DUAL_CURRENCY_NETWORKS,
  type ProductType,
} from '@rumbo/shared';

export function getAvailableCurrencies(
  productType: ProductType,
  productCurrency: Currency,
  metadata: Record<string, unknown> | null,
): Currency[] {
  if (productType === 'cash') {
    return ['COP', 'USD'];
  }

  if (productType === 'credit_card' && metadata) {
    const network = (metadata as Partial<CreditCardMetadata>).network;

    if (
      network &&
      DUAL_CURRENCY_NETWORKS.includes(network as (typeof DUAL_CURRENCY_NETWORKS)[number])
    ) {
      return ['COP', 'USD'];
    }
  }

  return [productCurrency];
}
