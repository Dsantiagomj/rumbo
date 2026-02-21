import { createFileRoute } from '@tanstack/react-router';
import { ProductsList } from '@/features/financial-products';

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});

function DashboardPage() {
  return <ProductsList />;
}
