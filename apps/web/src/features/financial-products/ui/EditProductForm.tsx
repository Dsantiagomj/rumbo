import { RiArrowLeftLine, RiLoader4Line } from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { useRouter } from '@tanstack/react-router';
import { Form } from '@/components/ui/form';
import { Button } from '@/shared/ui';
import { PRODUCT_TYPE_LABELS } from '../model/form-schemas';
import { ProductDetailsStep } from './ProductDetailsStep';
import { useEditProductForm } from './useEditProductForm';

type EditProductFormProps = {
  product: ProductResponse;
};

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const { form, handleSubmit, isPending, selectedType } = useEditProductForm(product);
  const typeLabel = PRODUCT_TYPE_LABELS[product.type];

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
        <div>
          <h1 className="font-semibold">Editar producto</h1>
          <p className="text-xs text-muted-foreground">{typeLabel.label}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <ProductDetailsStep form={form} selectedType={selectedType} />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </Form>
    </div>
  );
}
