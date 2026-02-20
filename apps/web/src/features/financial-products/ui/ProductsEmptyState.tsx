import { RiWalletLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/ui';

export function ProductsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <RiWalletLine className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">No tienes productos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega tu primera cuenta, tarjeta o inversion para empezar a gestionar tus finanzas.
        </p>
      </div>
      <Button asChild>
        <Link to="/products/new">Agregar producto</Link>
      </Button>
    </div>
  );
}
