import { RiAddLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/shared/ui';
import { BalanceSummary } from './BalanceSummary';
import { ProductGroup } from './ProductGroup';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsToolbar } from './ProductsToolbar';
import { QuickStats } from './QuickStats';
import { useProductsList } from './useProductsList';

export function ProductsList() {
  const {
    products,
    productGroups,
    isPending,
    isError,
    refetch,
    activeCurrency,
    setActiveCurrency,
  } = useProductsList();

  if (isPending) {
    return (
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8">
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

  if (products.length === 0) {
    return <ProductsEmptyState />;
  }

  return (
    <>
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8 md:min-h-full">
        <div className="md:border-r md:border-border md:pr-8">
          <div className="md:sticky md:top-0 space-y-4">
            <BalanceSummary
              products={products}
              activeCurrency={activeCurrency}
              onCurrencyChange={setActiveCurrency}
            />

            <QuickStats products={products} currency={activeCurrency} />

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

        <div className="max-w-3xl space-y-6 mt-6 md:mt-0">
          <ProductsToolbar />

          {productGroups.map(({ group, items }) => (
            <ProductGroup key={group.key} group={group} products={items} />
          ))}
        </div>
      </div>

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
