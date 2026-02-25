import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { TransactionDetailPage } from '@/features/financial-products';

const searchSchema = z.object({
  edit: z.boolean().optional(),
  from: z.enum(['transactions']).optional(),
});

export const Route = createFileRoute('/_app/products/$productId/transactions/$transactionId')({
  validateSearch: searchSchema,
  component: TransactionDetailRoute,
});

function TransactionDetailRoute() {
  const { productId, transactionId } = Route.useParams();
  const { edit } = Route.useSearch();
  return (
    <TransactionDetailPage productId={productId} transactionId={transactionId} initialEdit={edit} />
  );
}
