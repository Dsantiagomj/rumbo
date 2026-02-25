import { createFileRoute } from '@tanstack/react-router';
import { CreateTransactionPage } from '@/features/financial-products';

export const Route = createFileRoute('/_app/transactions/new')({
  component: NewTransactionPage,
});

function NewTransactionPage() {
  return <CreateTransactionPage />;
}
