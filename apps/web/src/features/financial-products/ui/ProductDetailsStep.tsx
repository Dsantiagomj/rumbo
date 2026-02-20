import type { CreditCardNetwork, ProductType } from '@rumbo/shared';
import { DUAL_CURRENCY_NETWORKS } from '@rumbo/shared';
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

const NETWORK_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'none', label: 'Sin franquicia' },
] as const;

type ProductDetailsStepProps = {
  form: UseFormReturn<CreateProductFormValues>;
  selectedType: ProductType;
};

function getBalanceLabel(type: ProductType): string {
  if (type === 'credit_card') return 'Saldo consumido (COP)';
  if (type === 'loan_free_investment' || type === 'loan_mortgage') return 'Deuda actual';
  return 'Saldo actual (COP)';
}

export function ProductDetailsStep({ form, selectedType }: ProductDetailsStepProps) {
  const isCreditCard = selectedType === 'credit_card';
  const isCash = selectedType === 'cash';
  const network = form.watch('metadata.network') as CreditCardNetwork | undefined;
  const hasDualCurrency =
    isCreditCard && network && (DUAL_CURRENCY_NETWORKS as readonly string[]).includes(network);

  if (isCash) {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo en pesos (COP)</FormLabel>
              <FormControl>
                <Input placeholder="0.00" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metadata.balanceUsd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo en dolares (USD)</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
                  inputMode="decimal"
                  {...field}
                  value={(field.value as string) ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

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

      {isCreditCard && (
        <FormField
          control={form.control}
          name="metadata.network"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Red / Franquicia</FormLabel>
              <Select onValueChange={field.onChange} value={(field.value as string) ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la red..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NETWORK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isCreditCard ? (
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getBalanceLabel(selectedType)}</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {hasDualCurrency && (
            <FormField
              control={form.control}
              name="metadata.balanceUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo consumido (USD)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      inputMode="decimal"
                      {...field}
                      value={(field.value as string) ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>{getBalanceLabel(selectedType)}</FormLabel>
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
      )}

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
