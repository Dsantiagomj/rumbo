import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h1 className="text-2xl font-bold">Products</h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
