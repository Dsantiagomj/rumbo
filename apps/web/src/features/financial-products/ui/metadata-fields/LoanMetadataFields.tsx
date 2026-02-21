import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MetadataRendererProps } from './index';

export function LoanMetadataFields({ form }: MetadataRendererProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="metadata.originalAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monto total</FormLabel>
            <FormControl>
              <Input placeholder="10000000" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="metadata.monthlyPayment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cuota mensual</FormLabel>
            <FormControl>
              <Input placeholder="500000" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="metadata.interestRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tasa de interes (%)</FormLabel>
            <FormControl>
              <Input placeholder="12.5" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="metadata.totalTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plazo total (meses)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="60"
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
          name="metadata.remainingTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plazo restante (meses)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="48"
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
    </div>
  );
}
