import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/budgets')({
  component: BudgetsPage,
});

function BudgetsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <h1 className="text-3xl font-semibold">Budgets</h1>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
