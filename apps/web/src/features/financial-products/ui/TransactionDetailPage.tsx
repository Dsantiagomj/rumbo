import { zodResolver } from '@hookform/resolvers/zod';
import {
  RiArrowLeftLine,
  RiArrowLeftRightLine,
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeOffLine,
  RiPriceTag3Line,
} from '@remixicon/react';
import { type Currency, TRANSACTION_TYPES, type TransactionResponse } from '@rumbo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApiError, apiClient } from '@/shared/api';
import { Button, Card, CardContent, Input, Separator, Skeleton } from '@/shared/ui';
import { listCategoriesQueryOptions } from '../model/category-queries';
import { formatBalance } from '../model/constants';
import { getProductQueryOptions } from '../model/queries';
import {
  type TransactionFormValues,
  transactionFormSchema,
} from '../model/transaction-form-schema';
import {
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from '../model/transaction-queries';

const TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

type TransactionDetailPageProps = {
  productId: string;
  transactionId: string;
  initialEdit?: boolean;
};

function TransactionEditForm({
  transaction,
  currency,
  productId,
  onCancel,
  onSaved,
}: {
  transaction: TransactionResponse;
  currency: Currency;
  productId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTransactionMutation();
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: transaction.name,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      categoryId: transaction.categoryId ?? undefined,
      merchant: transaction.merchant ?? undefined,
      notes: transaction.notes ?? undefined,
      excluded: transaction.excluded,
    },
  });

  const selectedType = form.watch('type');

  async function onSubmit(values: TransactionFormValues) {
    try {
      await updateMutation.mutateAsync({
        id: transaction.id,
        data: {
          ...values,
          categoryId: values.categoryId || null,
          merchant: values.merchant || null,
          notes: values.notes || null,
          date: new Date(values.date),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['transactions', productId] });
      await queryClient.invalidateQueries({
        queryKey: ['transactions', productId, transaction.id],
      });
      await queryClient.invalidateQueries({ queryKey: ['financial-products', productId] });
      await queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      sileo.success({ title: 'Transaccion actualizada' });
      onSaved();
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
        title: 'No se pudo actualizar',
        description: 'Intenta de nuevo.',
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="edit-name" className="text-sm font-medium">
          Nombre
        </label>
        <Input id="edit-name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Tipo</span>
        <div className="flex gap-1">
          {TRANSACTION_TYPES.map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={selectedType === t ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => form.setValue('type', t, { shouldValidate: true })}
            >
              {TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-amount" className="text-sm font-medium">
          Monto ({currency})
        </label>
        <Input id="edit-amount" type="text" inputMode="decimal" {...form.register('amount')} />
        {form.formState.errors.amount && (
          <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-date" className="text-sm font-medium">
          Fecha
        </label>
        <Input id="edit-date" type="date" {...form.register('date')} />
        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-category" className="text-sm font-medium">
          Categoria
        </label>
        <select
          id="edit-category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...form.register('categoryId')}
          defaultValue={transaction.categoryId ?? ''}
        >
          <option value="">Sin categoria</option>
          {categoriesData?.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-merchant" className="text-sm font-medium">
          Comercio
        </label>
        <Input id="edit-merchant" {...form.register('merchant')} placeholder="Opcional" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="edit-notes"
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={2}
          placeholder="Opcional"
          {...form.register('notes')}
        />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="edit-excluded" className="text-sm font-medium">
          Excluir de resumen
        </label>
        <input
          id="edit-excluded"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...form.register('excluded')}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

export function TransactionDetailPage({
  productId,
  transactionId,
  initialEdit = false,
}: TransactionDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTransactionMutation();
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions());

  const [isEditing, setIsEditing] = useState(initialEdit);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: product, isPending: isProductPending } = useQuery(
    getProductQueryOptions(productId),
  );

  const { data: transactionData, isPending: isTransactionPending } = useQuery({
    queryKey: ['transactions', productId, transactionId],
    queryFn: () => apiClient<TransactionResponse>(`/api/transactions/${transactionId}`),
  });

  const isPending = isProductPending || isTransactionPending;
  const transaction = transactionData;
  const currency = product?.currency ?? 'COP';

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(transactionId);
      await queryClient.invalidateQueries({ queryKey: ['transactions', productId] });
      await queryClient.invalidateQueries({ queryKey: ['financial-products', productId] });
      await queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      sileo.success({ title: 'Transaccion eliminada' });
      router.history.back();
    } catch {
      sileo.error({
        title: 'No se pudo eliminar',
        description: 'Intenta de nuevo.',
      });
    }
  }

  if (isPending) {
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
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-40 mx-auto" />
              <Skeleton className="h-px w-full" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction || !product) {
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
          <span className="font-medium">Transaccion</span>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No se encontro la transaccion o hubo un error al cargarla.
            </p>
            <Button variant="outline" onClick={() => router.history.back()}>
              <RiArrowLeftLine className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpense = transaction.type === 'expense';
  const displayAmount = `${isExpense ? '-' : ''}${formatBalance(transaction.amount, currency)}`;
  const formattedDate = new Date(transaction.date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const categoryName =
    categoriesData?.categories.find((c) => c.id === transaction.categoryId)?.name ??
    'Sin categoria';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver"
          onClick={() => router.history.back()}
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Button>
        <span className="font-medium">{isEditing ? 'Editar transaccion' : transaction.name}</span>
      </div>

      <Card>
        <CardContent className="py-6">
          {isEditing ? (
            <TransactionEditForm
              transaction={transaction}
              currency={currency}
              productId={productId}
              onCancel={() => setIsEditing(false)}
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-4">
              {/* Amount */}
              <div className="text-center py-2">
                <p
                  className={`text-2xl font-bold tabular-nums ${isExpense ? '' : 'text-emerald-600 dark:text-emerald-400'}`}
                >
                  {displayAmount}
                </p>
              </div>

              <Separator />

              {/* Detail rows */}
              <div>
                <div className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground">
                    <RiCalendarLine className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">Fecha</span>
                  <span className="ml-auto text-sm font-medium">{formattedDate}</span>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground">
                    <RiArrowLeftRightLine className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="ml-auto text-sm font-medium">
                    {TYPE_LABELS[transaction.type] ?? transaction.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground">
                    <RiPriceTag3Line className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">Categoria</span>
                  <span className="ml-auto text-sm font-medium">{categoryName}</span>
                </div>

                {transaction.merchant && (
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-muted-foreground">
                      <RiPriceTag3Line className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-muted-foreground">Comercio</span>
                    <span className="ml-auto text-sm font-medium">{transaction.merchant}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground">
                    <RiEyeOffLine className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">Excluido</span>
                  <span className="ml-auto text-sm font-medium">
                    {transaction.excluded ? 'Si' : 'No'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {transaction.notes && (
                <p className="text-sm text-muted-foreground">{transaction.notes}</p>
              )}

              <Separator />

              {/* Edit button */}
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                <RiEditLine className="h-4 w-4" />
                Editar transaccion
              </Button>

              <Separator />

              {/* Delete section */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Eliminar transaccion</p>
                  <p className="text-xs text-muted-foreground">
                    Eliminar permanentemente esta transaccion
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <RiDeleteBinLine className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar transaccion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La transaccion sera eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
