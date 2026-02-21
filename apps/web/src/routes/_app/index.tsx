import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AssetAllocationCard,
  CashFlowCard,
  DashboardHero,
  GoalsProgressCard,
  MonthlySpendingCard,
  ProductGroupsCard,
  RecentTransactionsCard,
  UpcomingPaymentsCard,
} from '@/features/dashboard';
import { listProductsQueryOptions, ProductsEmptyState } from '@/features/financial-products';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/shared/ui';

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { data, isPending, isError, refetch } = useQuery(listProductsQueryOptions());
  const [activeCurrency, setActiveCurrency] = useState<Currency>('COP');

  const products = data?.products ?? [];

  const currencies = useMemo(() => {
    const set = new Set<Currency>();
    for (const product of products) {
      set.add(product.currency);
      const meta = product.metadata as Record<string, unknown> | null;
      if (meta?.balanceUsd && typeof meta.balanceUsd === 'string') {
        set.add('USD');
      }
    }
    return Array.from(set);
  }, [products]);

  useEffect(() => {
    if (currencies.length === 0) return;
    const fallback = currencies[0];
    if (fallback && !currencies.includes(activeCurrency)) {
      setActiveCurrency(fallback);
    }
  }, [currencies, activeCurrency]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[280px] rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError && products.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error al cargar productos</AlertTitle>
          <AlertDescription>No pudimos cargar tus productos financieros.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return <ProductsEmptyState />;
  }

  const showErrorBanner = isError && products.length > 0;

  return (
    <div className="space-y-6">
      <DashboardHero
        userName={user.name || user.email}
        products={products}
        activeCurrency={activeCurrency}
        currencies={currencies}
        onCurrencyChange={setActiveCurrency}
      />

      {showErrorBanner && (
        <Alert variant="destructive">
          <AlertTitle>Error al actualizar productos</AlertTitle>
          <AlertDescription>
            Mostramos datos en cache. Reintenta para actualizar la lista.
          </AlertDescription>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AssetAllocationCard products={products} activeCurrency={activeCurrency} />
        <ProductGroupsCard products={products} />
        <CashFlowCard />

        <div className="md:col-span-2">
          <RecentTransactionsCard />
        </div>
        <UpcomingPaymentsCard />

        <div className="grid grid-cols-1 gap-4 md:col-span-3 md:grid-cols-2">
          <GoalsProgressCard />
          <MonthlySpendingCard />
        </div>
      </div>
    </div>
  );
}
