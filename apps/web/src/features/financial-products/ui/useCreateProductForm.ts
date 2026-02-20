import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/shared/api';
import { type CreateProductFormValues, createProductFormSchema } from '../model/form-schemas';
import { useCreateProductMutation } from '../model/queries';

type Step = 'type' | 'details' | 'review';
const STEPS: Step[] = ['type', 'details', 'review'];

export function useCreateProductForm() {
  const navigate = useNavigate();
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
    let fieldsToValidate: (keyof CreateProductFormValues)[] = [];
    if (currentStep === 'type') {
      fieldsToValidate = ['type'];
    } else if (currentStep === 'details') {
      fieldsToValidate = ['name', 'institution', 'balance', 'currency'];
    }
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1]);
    }
  }

  function goToPrev() {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1]);
  }

  function goToStep(step: number) {
    if (step >= 0 && step < STEPS.length) setCurrentStep(STEPS[step]);
  }

  async function handleSubmit(values: CreateProductFormValues) {
    try {
      await mutation.mutateAsync({
        type: values.type,
        name: values.name,
        institution: values.institution,
        balance: values.balance,
        currency: values.currency,
        metadata: values.metadata,
      });
      navigate({ to: '/products' });
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const path = detail.path.join('.');
          form.setError(path as keyof CreateProductFormValues, { message: detail.message });
        }
        setCurrentStep('details');
      }
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
