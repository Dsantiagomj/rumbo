import { createFileRoute } from '@tanstack/react-router';
import { CreateProductForm } from '@/features/financial-products';

export const Route = createFileRoute('/_app/products/new')({
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CreateProductForm />
    </div>
  );
}
