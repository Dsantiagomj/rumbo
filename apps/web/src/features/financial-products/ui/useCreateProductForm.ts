import { zodResolver } from '@hookform/resolvers/zod';
import { PRODUCT_TYPE_METADATA_MAP, type ProductResponse } from '@rumbo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { ApiError } from '@/shared/api';
import { type CreateProductFormValues, createProductFormSchema } from '../model/form-schemas';
import { useCreateProductMutation } from '../model/queries';

function negateDecimal(value: string): string {
  if (value.startsWith('-')) return value;
  return value === '0' || value === '0.00' ? value : `-${value}`;
}

type Step = 'type' | 'details' | 'review';
const STEPS: Step[] = ['type', 'details', 'review'];

export function useCreateProductForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateProductMutation();
  const [currentStep, setCurrentStep] = useState<Step>('type');

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    mode: 'onBlur',
    defaultValues: {
      type: undefined as unknown as CreateProductFormValues['type'],
      name: '',
      institution: '',
      balance: '0',
      currency: 'COP',
      metadata: {},
    },
  });

  const selectedType = form.watch('type');
  const stepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  async function goToNext() {
    if (currentStep === 'type') {
      const isValid = await form.trigger(['type']);
      const next = STEPS[stepIndex + 1];
      if (isValid && next) {
        setCurrentStep(next);
      }
    } else if (currentStep === 'details') {
      const isValid = await form.trigger(['name', 'institution', 'balance', 'currency']);
      if (!isValid) return;

      const type = form.getValues('type');
      const metadata = form.getValues('metadata');
      const metadataSchema = PRODUCT_TYPE_METADATA_MAP[type];
      const result = metadataSchema.safeParse(metadata);
      if (!result.success) {
        for (const issue of result.error.issues) {
          form.setError(`metadata.${issue.path.join('.')}` as keyof CreateProductFormValues, {
            message: issue.message,
          });
        }
        return;
      }

      const next = STEPS[stepIndex + 1];
      if (next) setCurrentStep(next);
    }
  }

  function goToPrev() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setCurrentStep(prev);
  }

  function goToStep(step: number) {
    const target = STEPS[step];
    if (target) setCurrentStep(target);
  }

  async function handleSubmit(values: CreateProductFormValues) {
    const isDebt =
      values.type === 'credit_card' ||
      values.type === 'loan_free_investment' ||
      values.type === 'loan_mortgage';

    const balance = isDebt ? negateDecimal(values.balance) : values.balance;
    const metadata = { ...values.metadata };
    if (isDebt && typeof metadata.balanceUsd === 'string' && metadata.balanceUsd) {
      metadata.balanceUsd = negateDecimal(metadata.balanceUsd);
    }

    try {
      const newProduct = await mutation.mutateAsync({
        type: values.type,
        name: values.name,
        institution: values.institution,
        balance,
        currency: values.currency,
        metadata,
      });
      queryClient.setQueryData<{ products: ProductResponse[] }>(['financial-products'], (old) => ({
        products: [...(old?.products ?? []), newProduct],
      }));
      router.history.back();
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const path = detail.path.join('.');
          form.setError(path as keyof CreateProductFormValues, { message: detail.message });
        }
        setCurrentStep('details');
        return;
      }

      sileo.error({
        title: 'No se pudo crear el producto',
        description: 'Intenta de nuevo en unos minutos.',
      });
    }
  }

  return {
    form,
    currentStep,
    selectedType,
    stepIndex,
    totalSteps: STEPS.length,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    goToStep,
    handleSubmit,
    isPending: mutation.isPending,
  };
}
