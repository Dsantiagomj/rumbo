import type { ProductType } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { PRODUCT_GROUPS } from '../model/constants';
import { PRODUCT_TYPE_LABELS, type ProductFormReturn } from '../model/form-schemas';
import { listProductsQueryOptions } from '../model/queries';

export function useTypeSelector(form: ProductFormReturn) {
  const { data } = useQuery(listProductsQueryOptions());
  const cashExists = data?.products.some((p) => p.type === 'cash') ?? false;
  const selectedType = form.watch('type');

  function handleTypeSelect(type: ProductType) {
    const previousType = form.getValues('type');
    form.setValue('type', type, { shouldValidate: true });
    if (previousType !== type) {
      form.setValue('metadata', {}, { shouldValidate: false });
    }
    if (type === 'cash') {
      form.setValue('name', 'Efectivo');
      form.setValue('institution', 'N/A');
      form.setValue('currency', 'COP');
    } else if (previousType === 'cash') {
      form.setValue('name', '');
      form.setValue('institution', '');
    }
  }

  return {
    selectedType,
    productGroups: PRODUCT_GROUPS,
    typeLabels: PRODUCT_TYPE_LABELS,
    handleTypeSelect,
    cashExists,
  };
}
