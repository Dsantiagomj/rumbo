import { zodResolver } from '@hookform/resolvers/zod';
import { RiArrowLeftLine } from '@remixicon/react';
import { type CreateTransaction, TRANSACTION_TYPES } from '@rumbo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { type FieldPath, useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { ApiError } from '@/shared/api';
import { Button, Card, CardContent, Input, Separator, Skeleton } from '@/shared/ui';
import { listCategoriesQueryOptions } from '../model/category-queries';
import { getProductQueryOptions } from '../model/queries';
import {
  type TransactionFormValues,
  transactionFormSchema,
} from '../model/transaction-form-schema';
import { useCreateTransactionMutation } from '../model/transaction-queries';

type CreateTransactionPageProps = {
  productId: string;
};

const TRANSACTION_TYPE_LABELS: Record<TransactionFormValues['type'], string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

function getDefaultValues(): TransactionFormValues {
  return {
    name: '',
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    categoryId: null,
    merchant: '',
    notes: '',
    excluded: false,
  };
}

export function CreateTransactionPage({ productId }: CreateTransactionPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateTransactionMutation(productId);
  const { data: product, isPending: isProductPending } = useQuery(
    getProductQueryOptions(productId),
  );
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    mode: 'onBlur',
    defaultValues: getDefaultValues(),
  });

  const selectedType = form.watch('type');
  const categories = categoriesData?.categories ?? [];

  async function handleSubmit(values: TransactionFormValues) {
    const currency = product?.currency ?? 'COP';
    const body: Omit<CreateTransaction, 'productId'> = {
      name: values.name,
      type: values.type,
      amount: values.amount,
      date: new Date(values.date),
      currency,
      categoryId: values.categoryId ?? null,
      merchant: values.merchant || null,
      notes: values.notes || null,
      excluded: values.excluded ?? false,
    };

    try {
      await mutation.mutateAsync(body);
      await queryClient.invalidateQueries({ queryKey: ['transactions', productId] });
      await queryClient.invalidateQueries({ queryKey: ['financial-products', productId] });
      await queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      sileo.success({ title: 'Transaccion creada' });
      router.history.back();
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const path = detail.path.join('.');
          form.setError(path as FieldPath<TransactionFormValues>, {
            message: detail.message,
          });
        }
        return;
      }

      sileo.error({
        title: 'No se pudo crear la transaccion',
        description: 'Intenta de nuevo.',
      });
    }
  }

  if (isProductPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver"
            onClick={() => router.history.back()}
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Button>
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver"
          onClick={() => router.history.back()}
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Button>
        <span className="font-medium">Nueva transaccion</span>
      </div>

      <Card>
        <CardContent className="py-6">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="txn-name" className="text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="txn-name"
                  placeholder="Ej: Almuerzo, Nomina..."
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
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
                        selectedType === type
                          ? 'bg-primary text-primary-foreground flex-1'
                          : 'flex-1'
                      }
                      onClick={() => form.setValue('type', type, { shouldValidate: true })}
                    >
                      {TRANSACTION_TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.type.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="txn-amount" className="text-sm font-medium">
                  Monto
                </label>
                <Input
                  id="txn-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...form.register('amount')}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="txn-date" className="text-sm font-medium">
                  Fecha
                </label>
                <Input id="txn-date" type="date" {...form.register('date')} />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="txn-category" className="text-sm font-medium">
                  Categoria
                </label>
                <select
                  id="txn-category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register('categoryId', {
                    setValueAs: (v: string) => (v === '' ? null : v),
                  })}
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
                <label htmlFor="txn-merchant" className="text-sm font-medium">
                  Comercio
                </label>
                <Input
                  id="txn-merchant"
                  placeholder="Ej: Exito, Rappi..."
                  {...form.register('merchant')}
                />
                {form.formState.errors.merchant && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.merchant.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="txn-notes" className="text-sm font-medium">
                  Notas
                </label>
                <textarea
                  id="txn-notes"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Notas adicionales..."
                  {...form.register('notes')}
                />
                {form.formState.errors.notes && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="txn-excluded"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...form.register('excluded')}
                />
                <label htmlFor="txn-excluded" className="text-sm font-medium">
                  Excluir de reportes
                </label>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.history.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
