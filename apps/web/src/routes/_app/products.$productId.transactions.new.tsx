import { createFileRoute } from '@tanstack/react-router';
import { CreateTransactionPage } from '@/features/financial-products';

export const Route = createFileRoute('/_app/products/$productId/transactions/new')({
  component: NewTransactionPage,
});

function NewTransactionPage() {
  const { productId } = Route.useParams();
  return <CreateTransactionPage productId={productId} />;
}
