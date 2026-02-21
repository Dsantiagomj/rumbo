import { RiArrowLeftLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { EditProductForm, getProductQueryOptions } from '@/features/financial-products';
import { Button, Card, CardContent, Skeleton } from '@/shared/ui';

export const Route = createFileRoute('/_app/products/$productId/edit')({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const router = useRouter();
  const { data: product, isPending, isError } = useQuery(getProductQueryOptions(productId));

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (isError || !product) {
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
          <span className="font-medium">Editar producto</span>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {isError
                ? 'Hubo un error al cargar el producto. Intenta de nuevo.'
                : 'No se encontro el producto.'}
            </p>
            <Button variant="outline" onClick={() => router.history.back()}>
              <RiArrowLeftLine className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <EditProductForm product={product} />;
}
