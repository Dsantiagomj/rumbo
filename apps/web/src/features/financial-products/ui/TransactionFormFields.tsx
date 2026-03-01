import { type Currency, TRANSACTION_TYPES } from '@rumbo/shared';
import type { UseFormReturn } from 'react-hook-form';
import { CategoryPickerField, DatePickerField } from '@/features/transactions/ui/components';
import { Button, Input } from '@/shared/ui';
import { TRANSACTION_TYPE_LABELS } from '../model/constants';
import type { TransactionFormValues } from '../model/transaction-form-schema';

type TransactionFormFieldsProps = {
  form: UseFormReturn<TransactionFormValues>;
  currency: Currency;
  categories: { id: string; name: string; parentId: string | null; transactionCount: number }[];
  currencies?: Currency[];
  typeLabels?: Record<TransactionFormValues['type'], string>;
  excludedLabel?: string;
  idPrefix?: string;
};

export function TransactionFormFields({
  form,
  currency,
  categories,
  currencies,
  typeLabels = TRANSACTION_TYPE_LABELS,
  excludedLabel = 'Excluir de reportes',
  idPrefix = 'transaction',
}: TransactionFormFieldsProps) {
  const selectedType = form.watch('type');
  const selectedCurrency = form.watch('currency') ?? currency;
  const nameId = `${idPrefix}-name`;
  const amountId = `${idPrefix}-amount`;
  const dateId = `${idPrefix}-date`;
  const categoryId = `${idPrefix}-category`;
  const merchantId = `${idPrefix}-merchant`;
  const notesId = `${idPrefix}-notes`;
  const excludedId = `${idPrefix}-excluded`;

  const showCurrencySelector = currencies && currencies.length > 1;

  return (
    <div className="space-y-4">
      {/* Tipo - primero */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Tipo</span>
        <div className="flex gap-2">
          {TRANSACTION_TYPES.filter((t) => t !== 'transfer').map((type) => (
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

      {/* Nombre - segundo */}
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="text-sm font-medium">
          Nombre
        </label>
        <Input id={nameId} placeholder="Ej: Almuerzo, Nomina..." {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Monto con selector de moneda opcional */}
      <div className="space-y-1.5">
        <label htmlFor={amountId} className="text-sm font-medium">
          Monto
        </label>
        <div className="flex gap-2">
          <Input
            id={amountId}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className={showCurrencySelector ? 'flex-1' : undefined}
            {...form.register('amount')}
          />
          {showCurrencySelector ? (
            <div className="flex">
              {currencies.map((cur) => (
                <Button
                  key={cur}
                  type="button"
                  size="sm"
                  variant={selectedCurrency === cur ? 'default' : 'outline'}
                  className={
                    selectedCurrency === cur
                      ? 'rounded-l-none first:rounded-l-md last:rounded-r-md border-l-0 first:border-l'
                      : 'rounded-l-none first:rounded-l-md last:rounded-r-md border-l-0 first:border-l'
                  }
                  onClick={() => form.setValue('currency', cur, { shouldValidate: true })}
                >
                  {cur}
                </Button>
              ))}
            </div>
          ) : (
            <span className="flex items-center px-3 text-sm text-muted-foreground">{currency}</span>
          )}
        </div>
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Fecha</span>
        <DatePickerField
          id={dateId}
          value={form.watch('date')}
          onChange={(value) => form.setValue('date', value, { shouldValidate: true })}
        />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Categoria</span>
        <CategoryPickerField
          id={categoryId}
          categories={categories}
          value={form.watch('categoryId') ?? null}
          onChange={(value) => form.setValue('categoryId', value, { shouldValidate: true })}
        />
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
