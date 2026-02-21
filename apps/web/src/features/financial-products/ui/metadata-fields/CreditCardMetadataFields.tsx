import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MetadataRendererProps } from './index';

export function CreditCardMetadataFields({ form }: MetadataRendererProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="metadata.last4Digits"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ultimos 4 digitos</FormLabel>
            <FormControl>
              <Input
                maxLength={4}
                placeholder="1234"
                {...field}
                value={(field.value as string) ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="metadata.creditLimit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cupo total</FormLabel>
            <FormControl>
              <Input placeholder="5000000" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="metadata.cutoffDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia de corte</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="15"
                  {...field}
                  value={(field.value as number) ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metadata.paymentDueDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia de pago</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="5"
                  {...field}
                  value={(field.value as number) ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="metadata.interestRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tasa de interes (%)</FormLabel>
            <FormControl>
              <Input
                placeholder="28.5"
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
