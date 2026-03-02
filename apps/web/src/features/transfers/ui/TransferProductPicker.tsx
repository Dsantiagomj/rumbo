import type { Currency, ProductResponse } from '@rumbo/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatBalance } from '@/features/financial-products/model/constants';

type TransferProductPickerProps = {
  products: ProductResponse[];
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
  label: string;
  id?: string;
  placeholder?: string;
};

export function TransferProductPicker({
  products,
  value,
  onChange,
  excludeId,
  label,
  id,
  placeholder = 'Seleccionar producto',
}: TransferProductPickerProps) {
  const filteredProducts = excludeId ? products.filter((p) => p.id !== excludeId) : products;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full h-10 text-sm px-3">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-60">
          {filteredProducts.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              <span className="flex items-center justify-between gap-3 w-full">
                <span className="truncate">{product.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatBalance(product.balance, product.currency as Currency)}
                </span>
              </span>
            </SelectItem>
          ))}
          {filteredProducts.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No hay productos disponibles
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
