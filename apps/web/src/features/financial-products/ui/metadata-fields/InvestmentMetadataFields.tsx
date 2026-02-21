import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MetadataRendererProps } from './index';

export function InvestmentMetadataFields({ form }: MetadataRendererProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="metadata.units"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unidades/acciones (opcional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="100"
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
        name="metadata.broker"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Corredor/Intermediario (opcional)</FormLabel>
            <FormControl>
              <Input placeholder="tyba" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
