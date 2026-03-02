import { createFileRoute } from '@tanstack/react-router';
import { CreateTransferForm } from '@/features/transfers';

export const Route = createFileRoute('/_app/transfers_/new')({
  component: NewTransferPage,
});

function NewTransferPage() {
  return <CreateTransferForm />;
}
