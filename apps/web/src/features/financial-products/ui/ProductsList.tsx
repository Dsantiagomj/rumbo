import { RiAddLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/shared/ui';
import { PRODUCT_GROUPS } from '../model/constants';
import { listProductsQueryOptions } from '../model/queries';
import { BalanceSummary } from './BalanceSummary';
import { ProductGroup } from './ProductGroup';
import { ProductsEmptyState } from './ProductsEmptyState';

export function ProductsList() {
  const { data, isPending, isError, refetch } = useQuery(listProductsQueryOptions());

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Productos</h1>
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
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <ProductsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button size="icon" variant="outline" asChild>
          <Link to="/products/new">
            <RiAddLine className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <BalanceSummary products={products} />

      <div className="space-y-6">
        {PRODUCT_GROUPS.map((group) => {
          const groupProducts = products.filter((p) => group.types.includes(p.type));
          return <ProductGroup key={group.key} group={group} products={groupProducts} />;
        })}
      </div>
    </div>
  );
}
