import type { ProductType } from '@rumbo/shared';
import type { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CURRENCY_LABELS } from '../model/constants';
import type { CreateProductFormValues } from '../model/form-schemas';
import { PRODUCT_TYPE_LABELS } from '../model/form-schemas';
import { InstitutionCombobox } from './InstitutionCombobox';
import { MetadataFields } from './metadata-fields';

type ProductDetailsStepProps = {
  form: UseFormReturn<CreateProductFormValues>;
  selectedType: ProductType;
};

export function ProductDetailsStep({ form, selectedType }: ProductDetailsStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del producto</FormLabel>
            <FormControl>
              <Input placeholder="Mi cuenta de ahorros" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="institution"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institucion</FormLabel>
            <FormControl>
              <InstitutionCombobox value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Saldo actual</FormLabel>
              <FormControl>
                <Input placeholder="0.00" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CURRENCY_LABELS).map(([value]) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Detalles de {PRODUCT_TYPE_LABELS[selectedType].label}
          </span>
          <Separator className="flex-1" />
        </div>
        <MetadataFields type={selectedType} form={form} />
      </div>
    </div>
  );
}
