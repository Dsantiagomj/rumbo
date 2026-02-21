import { zodResolver } from '@hookform/resolvers/zod';
import type { ProductResponse, UpdateProduct } from '@rumbo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { type FieldPath, useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { ApiError } from '@/shared/api';
import {
  type CreateProductFormInput,
  type CreateProductFormValues,
  createProductFormSchema,
} from '../model/form-schemas';
import { useUpdateProductMutation } from '../model/queries';

function negateDecimal(value: string): string {
  if (value.startsWith('-')) return value;
  return value === '0' || value === '0.00' ? value : `-${value}`;
}

function absDecimal(value: string): string {
  if (value.startsWith('-')) return value.slice(1);
  return value;
}

export function useEditProductForm(product: ProductResponse) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useUpdateProductMutation(product.id);

  const isDebt =
    product.type === 'credit_card' ||
    product.type === 'loan_free_investment' ||
    product.type === 'loan_mortgage';

  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  const initialBalance = isDebt ? absDecimal(product.balance) : product.balance;
  const initialMetadata = { ...metadata };
  if (isDebt && typeof initialMetadata.balanceUsd === 'string' && initialMetadata.balanceUsd) {
    initialMetadata.balanceUsd = absDecimal(initialMetadata.balanceUsd);
  }

  const form = useForm<CreateProductFormInput, unknown, CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    mode: 'onBlur',
    defaultValues: {
      type: product.type,
      name: product.name,
      institution: product.institution,
      balance: initialBalance,
      currency: product.currency,
      metadata: initialMetadata,
    },
  });

  const selectedType = form.watch('type');

  async function handleSubmit(values: CreateProductFormValues) {
    const balance = isDebt ? negateDecimal(values.balance) : values.balance;
    const updatedMetadata = { ...(values.metadata ?? {}) };
    if (isDebt && typeof updatedMetadata.balanceUsd === 'string' && updatedMetadata.balanceUsd) {
      updatedMetadata.balanceUsd = negateDecimal(updatedMetadata.balanceUsd);
    }

    const data: UpdateProduct = {};
    if (values.name !== product.name) data.name = values.name;
    if (values.institution !== product.institution) data.institution = values.institution;
    if (balance !== product.balance) data.balance = balance;
    if (values.currency !== product.currency) data.currency = values.currency;

    const originalMetadata = product.metadata ?? {};
    if (JSON.stringify(updatedMetadata) !== JSON.stringify(originalMetadata)) {
      data.metadata = updatedMetadata;
    }

    if (Object.keys(data).length === 0) {
      router.navigate({ to: '/products/$productId', params: { productId: product.id } });
      return;
    }

    try {
      await mutation.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-products', product.id] });
      sileo.success({ title: 'Producto actualizado' });
      router.navigate({ to: '/products/$productId', params: { productId: product.id } });
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const path = detail.path.join('.');
          form.setError(path as FieldPath<CreateProductFormInput>, { message: detail.message });
        }
        return;
      }

      sileo.error({
        title: 'No se pudo actualizar el producto',
        description: 'Intenta de nuevo en unos minutos.',
      });
    }
  }

  return {
    form,
    handleSubmit,
    isPending: mutation.isPending,
    selectedType,
  };
}
