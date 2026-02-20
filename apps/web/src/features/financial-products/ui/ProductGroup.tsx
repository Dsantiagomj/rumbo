import type { ProductResponse } from '@rumbo/shared';
import type { ProductGroup as ProductGroupType } from '../model/constants';
import { ProductCard } from './ProductCard';

type ProductGroupProps = {
  group: ProductGroupType;
  products: ProductResponse[];
};

export function ProductGroup({ group, products }: ProductGroupProps) {
  if (products.length === 0) return null;

  const Icon = group.icon;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{group.label}</h2>
        <span className="text-sm text-muted-foreground">({products.length})</span>
      </div>
      <div className="grid gap-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} icon={group.icon} />
        ))}
      </div>
    </section>
  );
}
