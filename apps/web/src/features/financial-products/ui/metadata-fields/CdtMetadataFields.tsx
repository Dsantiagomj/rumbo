import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MetadataRendererProps } from './index';

export function CdtMetadataFields({ form }: MetadataRendererProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="metadata.originalAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monto original</FormLabel>
            <FormControl>
              <Input placeholder="10000000" {...field} value={(field.value as string) ?? ''} />
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
              <Input placeholder="8.5" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="metadata.startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de inicio</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metadata.maturityDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de vencimiento</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="metadata.autoRenewal"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={(field.value as boolean) ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="font-normal">Renovacion automatica</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}
