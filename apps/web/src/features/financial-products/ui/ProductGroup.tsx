import { RiArrowDownSLine } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import type { ProductGroup as ProductGroupType } from '../model/constants';
import { formatBalance } from '../model/constants';
import { ProductCard } from './ProductCard';
import { useProductGroup } from './useProductGroup';

type ProductGroupProps = {
  group: ProductGroupType;
  products: ProductResponse[];
};

export function ProductGroup({ group, products }: ProductGroupProps) {
  const { isOpen, subtotals, toggleOpen } = useProductGroup(products);

  if (products.length === 0) return null;

  const Icon = group.icon;

  return (
    <section>
      <button
        type="button"
        onClick={toggleOpen}
        className="mb-3 flex w-full items-center gap-2 text-left"
      >
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
        <RiArrowDownSLine
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} icon={group.icon} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
