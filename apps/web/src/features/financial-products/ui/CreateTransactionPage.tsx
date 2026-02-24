import { zodResolver } from '@hookform/resolvers/zod';
import { RiArrowLeftLine } from '@remixicon/react';
import type { CreateTransaction } from '@rumbo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { type FieldPath, useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { ApiError } from '@/shared/api';
import { Button, Card, CardContent, Separator, Skeleton } from '@/shared/ui';
import { listCategoriesQueryOptions } from '../model/category-queries';
import { getProductQueryOptions } from '../model/queries';
import {
  type TransactionFormValues,
  transactionFormSchema,
} from '../model/transaction-form-schema';
import { useCreateTransactionMutation } from '../model/transaction-queries';
import { TransactionFormFields } from './TransactionFormFields';

type CreateTransactionPageProps = {
  productId: string;
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
            <TransactionFormFields
              form={form}
              currency={product.currency}
              categories={categories}
              excludedLabel="Excluir de reportes"
              idPrefix="txn"
            />
            <Separator />
            <div className="flex gap-3 pt-2">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
