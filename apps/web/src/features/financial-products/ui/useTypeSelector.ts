import type { ProductType } from '@rumbo/shared';
import type { UseFormReturn } from 'react-hook-form';
import { PRODUCT_GROUPS } from '../model/constants';
import type { CreateProductFormValues } from '../model/form-schemas';
import { PRODUCT_TYPE_LABELS } from '../model/form-schemas';

export function useTypeSelector(form: UseFormReturn<CreateProductFormValues>) {
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
  };
}
