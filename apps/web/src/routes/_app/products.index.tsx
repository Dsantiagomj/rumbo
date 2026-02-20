import { createFileRoute } from '@tanstack/react-router';
import { ProductsList } from '@/features/financial-products';

export const Route = createFileRoute('/_app/products/')({
  component: ProductsPage,
});

function ProductsPage() {
  return <ProductsList />;
}
