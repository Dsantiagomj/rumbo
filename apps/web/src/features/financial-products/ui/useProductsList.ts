import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PRODUCT_GROUPS } from '../model/constants';
import { listProductsQueryOptions } from '../model/queries';

export function useProductsList() {
  const { data, isPending, isError, refetch } = useQuery(listProductsQueryOptions());
  const [activeCurrency, setActiveCurrency] = useState<Currency>('COP');

  const products = data?.products ?? [];

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
