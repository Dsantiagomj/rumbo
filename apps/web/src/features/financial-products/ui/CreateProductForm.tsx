import { RiArrowLeftLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ProductDetailsStep } from './ProductDetailsStep';
import { ReviewStep } from './ReviewStep';
import { StepIndicator } from './StepIndicator';
import { TypeSelector } from './TypeSelector';
import { useCreateProductForm } from './useCreateProductForm';

const STEP_CONFIG = [{ label: 'Tipo' }, { label: 'Detalles' }, { label: 'Confirmar' }];

export function CreateProductForm() {
  const {
    form,
    currentStep,
    selectedType,
    stepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    goToStep,
    handleSubmit,
    isPending,
  } = useCreateProductForm();

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={stepIndex} totalSteps={totalSteps} steps={STEP_CONFIG} />
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'type' && 'Selecciona el tipo de producto'}
            {currentStep === 'details' && 'Completa los detalles'}
            {currentStep === 'review' && 'Revisa y confirma'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isLastStep) {
                  form.handleSubmit(handleSubmit)(e);
                }
              }}
              className="space-y-6"
            >
              {currentStep === 'type' && <TypeSelector form={form} />}
              {currentStep === 'details' && selectedType && (
                <ProductDetailsStep form={form} selectedType={selectedType} />
              )}
              {currentStep === 'review' && <ReviewStep form={form} onEditStep={goToStep} />}

              <div className="flex justify-between pt-4">
                {!isFirstStep ? (
                  <Button type="button" variant="outline" onClick={goToPrev}>
                    <RiArrowLeftLine className="mr-2 h-4 w-4" />
                    Atras
                  </Button>
                ) : (
                  <div />
                )}
                {isLastStep ? (
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creando...' : 'Crear producto'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goToNext}
                    disabled={currentStep === 'type' && !selectedType}
                  >
                    Siguiente
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
