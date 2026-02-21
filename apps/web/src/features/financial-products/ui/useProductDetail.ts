import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { sileo } from 'sileo';
import { getProductQueryOptions, useDeleteProductMutation } from '../model/queries';

export function useProductDetail(productId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: product, isPending, isError } = useQuery(getProductQueryOptions(productId));

  const deleteMutation = useDeleteProductMutation(productId);

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['financial-products'] });
      queryClient.removeQueries({ queryKey: ['financial-products', productId] });
      sileo.success({ title: 'Producto eliminado', description: 'El producto ha sido eliminado.' });
      router.navigate({ to: '/products' });
    } catch {
      sileo.error({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el producto. Intenta de nuevo.',
      });
    }
  }

  return {
    product,
    isPending,
    isError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
