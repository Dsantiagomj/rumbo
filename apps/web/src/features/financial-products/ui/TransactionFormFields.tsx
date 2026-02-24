import { type Currency, TRANSACTION_TYPES } from '@rumbo/shared';
import type { UseFormReturn } from 'react-hook-form';
import { Button, Input } from '@/shared/ui';
import { TRANSACTION_TYPE_LABELS } from '../model/constants';
import type { TransactionFormValues } from '../model/transaction-form-schema';

type TransactionFormFieldsProps = {
  form: UseFormReturn<TransactionFormValues>;
  currency: Currency;
  categories: { id: string; name: string }[];
  typeLabels?: Record<TransactionFormValues['type'], string>;
  excludedLabel?: string;
  idPrefix?: string;
};

export function TransactionFormFields({
  form,
  currency,
  categories,
  typeLabels = TRANSACTION_TYPE_LABELS,
  excludedLabel = 'Excluir de reportes',
  idPrefix = 'transaction',
}: TransactionFormFieldsProps) {
  const selectedType = form.watch('type');
  const nameId = `${idPrefix}-name`;
  const amountId = `${idPrefix}-amount`;
  const dateId = `${idPrefix}-date`;
  const categoryId = `${idPrefix}-category`;
  const merchantId = `${idPrefix}-merchant`;
  const notesId = `${idPrefix}-notes`;
  const excludedId = `${idPrefix}-excluded`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="text-sm font-medium">
          Nombre
        </label>
        <Input id={nameId} placeholder="Ej: Almuerzo, Nomina..." {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Tipo</span>
        <div className="flex gap-2">
          {TRANSACTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={selectedType === type ? 'default' : 'outline'}
              className={
                selectedType === type ? 'bg-primary text-primary-foreground flex-1' : 'flex-1'
              }
              onClick={() => form.setValue('type', type, { shouldValidate: true })}
            >
              {typeLabels[type]}
            </Button>
          ))}
        </div>
        {form.formState.errors.type && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.type.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={amountId} className="text-sm font-medium">
          Monto ({currency})
        </label>
        <Input
          id={amountId}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          {...form.register('amount')}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={dateId} className="text-sm font-medium">
          Fecha
        </label>
        <Input id={dateId} type="date" {...form.register('date')} />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={categoryId} className="text-sm font-medium">
          Categoria
        </label>
        <select
          id={categoryId}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register('categoryId', {
            setValueAs: (value: string) => (value === '' ? null : value),
          })}
          defaultValue={form.getValues('categoryId') ?? ''}
        >
          <option value="">Sin categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {form.formState.errors.categoryId && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.categoryId.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={merchantId} className="text-sm font-medium">
          Comercio
        </label>
        <Input id={merchantId} {...form.register('merchant')} placeholder="Ej: Exito, Rappi..." />
        {form.formState.errors.merchant && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.merchant.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={notesId} className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id={notesId}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Notas adicionales..."
          {...form.register('notes')}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id={excludedId}
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...form.register('excluded')}
        />
        <label htmlFor={excludedId} className="text-sm font-medium">
          {excludedLabel}
        </label>
      </div>
    </div>
  );
}
