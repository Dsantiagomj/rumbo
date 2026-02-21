import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { PRODUCT_GROUPS } from '../model/constants';
import { listProductsQueryOptions } from '../model/queries';

export function useProductsList() {
  const { data, isPending, isError, refetch } = useQuery(listProductsQueryOptions());
  const [activeCurrency, setActiveCurrency] = useState<Currency>('COP');

  const products = data?.products ?? [];

  const availableCurrencies = useMemo(() => {
    const currencies = new Set<Currency>();
    for (const product of products) {
      currencies.add(product.currency);
      const meta = product.metadata as Record<string, unknown> | null;
      if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
        currencies.add('USD');
      }
    }
    return Array.from(currencies);
  }, [products]);

  useEffect(() => {
    if (availableCurrencies.length === 0) return;
    if (!availableCurrencies.includes(activeCurrency)) {
      setActiveCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, activeCurrency]);

  const productGroups = PRODUCT_GROUPS.map((group) => ({
    group,
    items: products.filter((p) => group.types.includes(p.type)),
  }));

  return {
    products,
    productGroups,
    isPending,
    isError,
    refetch,
    activeCurrency,
    setActiveCurrency,
  };
}
