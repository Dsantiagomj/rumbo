import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MetadataRendererProps } from './index';

export function AccountMetadataFields({ form }: MetadataRendererProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="metadata.accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ultimos 4 digitos (opcional)</FormLabel>
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
        name="metadata.gmfExempt"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={(field.value as boolean) ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="font-normal">Exenta de GMF (4x1000)</FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="metadata.interestRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tasa de interes (%) (opcional)</FormLabel>
            <FormControl>
              <Input placeholder="4.5" {...field} value={(field.value as string) ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
