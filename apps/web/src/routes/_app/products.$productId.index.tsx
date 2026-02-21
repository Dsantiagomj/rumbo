import { createFileRoute } from '@tanstack/react-router';
import { ProductDetail } from '@/features/financial-products';

export const Route = createFileRoute('/_app/products/$productId/')({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  return <ProductDetail productId={productId} />;
}
