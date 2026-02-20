import type { Currency, ProductResponse } from '@rumbo/shared';
import { useState } from 'react';

function computeSubtotals(products: ProductResponse[]): { currency: Currency; total: number }[] {
  const map = products.reduce<Partial<Record<Currency, number>>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + Number.parseFloat(p.balance);
    return acc;
  }, {});

  return (Object.entries(map) as [Currency, number][]).map(([currency, total]) => ({
    currency,
    total,
  }));
}

export function useProductGroup(products: ProductResponse[]) {
  const [isOpen, setIsOpen] = useState(true);

  const subtotals = computeSubtotals(products);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    subtotals,
    toggleOpen,
  };
}
