import { RiAddLine } from '@remixicon/react';
import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/shared/ui';
import { PRODUCT_GROUPS } from '../model/constants';
import { listProductsQueryOptions } from '../model/queries';
import { BalanceSummary } from './BalanceSummary';
import { ProductGroup } from './ProductGroup';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsToolbar } from './ProductsToolbar';
import { QuickStats } from './QuickStats';

export function ProductsList() {
  const { data, isPending, isError, refetch } = useQuery(listProductsQueryOptions());
  const [activeCurrency, setActiveCurrency] = useState<Currency>('COP');

  if (isPending) {
    return (
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8">
        {/* Left sidebar skeleton */}
        <div className="md:border-r md:border-border md:pr-8">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4 md:items-start">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-16" />
            <Skeleton className="hidden md:block h-9" />
          </div>
        </div>
        {/* Right content skeleton */}
        <div className="max-w-3xl space-y-6 mt-6 md:mt-0">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
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

  const products = data.products;

  if (products.length === 0) {
    return <ProductsEmptyState />;
  }

  return (
    <>
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8 md:min-h-full">
        {/* Left sidebar — full-height border, sticky content */}
        <div className="md:border-r md:border-border md:pr-8">
          <div className="md:sticky md:top-0 space-y-4">
            <BalanceSummary
              products={products}
              activeCurrency={activeCurrency}
              onCurrencyChange={setActiveCurrency}
            />

            <QuickStats products={products} currency={activeCurrency} />

            {/* Add product button — desktop only */}
            <div className="hidden md:block">
              <Button size="sm" className="w-full" asChild>
                <Link to="/products/new">
                  <RiAddLine className="h-4 w-4" />
                  Agregar producto
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right content — toolbar + product groups */}
        <div className="max-w-3xl space-y-6 mt-6 md:mt-0">
          <ProductsToolbar />

          {PRODUCT_GROUPS.map((group) => {
            const groupProducts = products.filter((p) => group.types.includes(p.type));
            return <ProductGroup key={group.key} group={group} products={groupProducts} />;
          })}
        </div>
      </div>

      {/* FAB — mobile only, above bottom nav */}
      <Link
        to="/products/new"
        className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95 transition-transform md:hidden"
        aria-label="Agregar producto"
      >
        <RiAddLine className="h-6 w-6" />
      </Link>
    </>
  );
}
