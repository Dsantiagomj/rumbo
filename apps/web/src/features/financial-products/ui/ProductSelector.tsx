import { RiArrowRightSLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, Skeleton } from '@/shared/ui';
import { formatBalance } from '../model/constants';
import { PRODUCT_TYPE_LABELS } from '../model/form-schemas';
import { listProductsQueryOptions } from '../model/queries';

type ProductSelectorProps = {
  onSelect: (productId: string) => void;
};

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const { data, isPending } = useQuery(listProductsQueryOptions());
  const products = data?.products ?? [];

  if (isPending) {
    return (
      <div className="space-y-3" data-testid="product-selector-loading">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No tienes productos aun. Crea uno para empezar a registrar transacciones.
          </p>
          <Link to="/products/new" className="text-sm font-medium text-primary hover:underline">
            Crear producto
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        Selecciona la cuenta para la transaccion:
      </p>
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onSelect(product.id)}
          className="w-full cursor-pointer"
        >
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {PRODUCT_TYPE_LABELS[product.type].label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatBalance(product.balance, product.currency)}
                </span>
                <RiArrowRightSLine className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
