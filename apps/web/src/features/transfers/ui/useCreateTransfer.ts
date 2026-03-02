import { zodResolver } from '@hookform/resolvers/zod';
import type { Currency } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { listProductsQueryOptions } from '@/features/financial-products';
import { formatBalance } from '@/features/financial-products/model/constants';
import { ApiError } from '@/shared/api';
import { trmQueryOptions, useCreateTransferMutation } from '../model/queries';
import { type TransferFormValues, transferFormSchema } from '../model/transfer-form-schema';

export function useCreateTransfer() {
  const router = useRouter();
  const mutation = useCreateTransferMutation();

  const { data: productsData, isPending: isProductsPending } = useQuery(listProductsQueryOptions());
  const products = productsData?.products ?? [];

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    mode: 'onBlur',
    defaultValues: {
      sourceProductId: '',
      destinationProductId: '',
      amount: '',
      currency: 'COP',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      exchangeRate: '',
    },
  });

  const sourceProductId = form.watch('sourceProductId');
  const destinationProductId = form.watch('destinationProductId');
  const amount = form.watch('amount');
  const exchangeRateInput = form.watch('exchangeRate');

  const sourceProduct = products.find((p) => p.id === sourceProductId);
  const destProduct = products.find((p) => p.id === destinationProductId);

  const sourceCurrency = sourceProduct?.currency as Currency | undefined;
  const destCurrency = destProduct?.currency as Currency | undefined;

  const isCrossCurrency = !!sourceCurrency && !!destCurrency && sourceCurrency !== destCurrency;

  // Fetch TRM rate only when cross-currency is detected
  const {
    data: trmData,
    isPending: isTrmPending,
    isError: isTrmError,
  } = useQuery({
    ...trmQueryOptions(),
    enabled: isCrossCurrency,
  });

  // When source product changes, update the currency to match
  if (sourceCurrency && form.getValues('currency') !== sourceCurrency) {
    form.setValue('currency', sourceCurrency, { shouldValidate: false });
  }

  // Compute preview amount for cross-currency transfers
  const previewAmount = useMemo(() => {
    if (!isCrossCurrency || !amount) return null;

    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return null;

    // Use manual exchange rate if TRM is unavailable
    const effectiveRate = isTrmError
      ? exchangeRateInput
        ? Number.parseFloat(exchangeRateInput)
        : null
      : trmData
        ? Number.parseFloat(trmData.rate)
        : null;

    if (!effectiveRate || Number.isNaN(effectiveRate) || effectiveRate <= 0) return null;

    // COP -> USD: divide by rate; USD -> COP: multiply by rate
    // sourceCurrency and destCurrency are guaranteed non-null by the isCrossCurrency guard above
    const srcCur = sourceCurrency as Currency;
    const dstCur = destCurrency as Currency;

    let converted: number;
    if (srcCur === 'COP' && dstCur === 'USD') {
      converted = parsedAmount / effectiveRate;
    } else {
      converted = parsedAmount * effectiveRate;
    }

    return {
      amount: converted,
      formattedSource: formatBalance(amount, srcCur),
      formattedDest: formatBalance(converted.toFixed(2), dstCur),
      rate: effectiveRate,
    };
  }, [
    isCrossCurrency,
    amount,
    trmData,
    isTrmError,
    exchangeRateInput,
    sourceCurrency,
    destCurrency,
  ]);

  async function handleSubmit(values: TransferFormValues) {
    // Determine the exchange rate to send
    let exchangeRate: string | undefined;
    if (isCrossCurrency) {
      if (isTrmError && values.exchangeRate) {
        exchangeRate = values.exchangeRate;
      } else if (trmData) {
        exchangeRate = trmData.rate;
      }
    }

    try {
      await mutation.mutateAsync({
        sourceProductId: values.sourceProductId,
        destinationProductId: values.destinationProductId,
        amount: values.amount,
        currency: values.currency,
        date: new Date(values.date).toISOString(),
        notes: values.notes || null,
        exchangeRate,
      });

      sileo.success({ title: 'Transferencia creada' });
      router.history.back();
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const path = detail.path.join('.');
          form.setError(path as FieldPath<TransferFormValues>, {
            message: detail.message,
          });
        }
        return;
      }

      sileo.error({
        title: 'No se pudo crear la transferencia',
        description: 'Intenta de nuevo.',
      });
    }
  }

  return {
    form,
    products,
    isProductsPending,
    sourceProduct,
    destProduct,
    sourceCurrency,
    destCurrency,
    isCrossCurrency,
    trmData,
    isTrmPending,
    isTrmError,
    previewAmount,
    mutation,
    handleSubmit,
    goBack: () => router.history.back(),
  };
}
