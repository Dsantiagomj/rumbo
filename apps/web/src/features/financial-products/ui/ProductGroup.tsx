import type { Currency, ProductResponse } from '@rumbo/shared';
import type { ProductGroup as ProductGroupType } from '../model/constants';
import { formatBalance } from '../model/constants';
import { ProductCard } from './ProductCard';

type ProductGroupProps = {
  group: ProductGroupType;
  products: ProductResponse[];
};

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

export function ProductGroup({ group, products }: ProductGroupProps) {
  if (products.length === 0) return null;

  const Icon = group.icon;
  const subtotals = computeSubtotals(products);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{group.label}</h2>
        <span className="text-sm text-muted-foreground">({products.length})</span>
        <span className="ml-auto text-sm font-medium tabular-nums">
          {subtotals.map((s, i) => (
            <span key={s.currency}>
              {i > 0 && ' / '}
              <span className={s.total < 0 ? 'text-destructive' : ''}>
                {formatBalance(String(s.total), s.currency)}
              </span>
            </span>
          ))}
        </span>
      </div>
      <div className="grid gap-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} icon={group.icon} />
        ))}
      </div>
    </section>
  );
}
