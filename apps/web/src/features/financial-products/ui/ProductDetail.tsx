import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExchangeLine,
  RiMoreLine,
  RiTimeLine,
} from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { Link, useRouter } from '@tanstack/react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button, Card, CardContent, Skeleton } from '@/shared/ui';
import { PRODUCT_GROUPS } from '../model/constants';
import { METADATA_FIELD_CONFIG, PRODUCT_TYPE_LABELS } from '../model/form-schemas';
import { useProductCard } from './useProductCard';
import { useProductDetail } from './useProductDetail';

function formatMetadataValue(key: string, value: unknown): string {
  const config = METADATA_FIELD_CONFIG[key];
  if (!config) return String(value);
  if (config.type === 'boolean') return value ? 'Si' : 'No';
  if (config.type === 'select' && config.options) {
    const option = config.options.find((o) => o.value === value);
    return option?.label ?? String(value);
  }
  return String(value);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-32" />
      <Skeleton className="h-24" />
    </div>
  );
}

function HeroSection({ product }: { product: ProductResponse }) {
  const cardData = useProductCard(product);
  const group = PRODUCT_GROUPS.find((g) => g.types.includes(product.type));
  const typeLabel = PRODUCT_TYPE_LABELS[product.type];
  const GroupIcon = group?.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {GroupIcon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <GroupIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{typeLabel.label}</p>
          <p className="font-semibold text-lg truncate">{product.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {product.institution !== 'N/A' ? product.institution : 'Billetera personal'}
          </p>
        </div>
      </div>

      <div className="text-center py-4">
        <p
          className={`text-3xl font-bold tabular-nums ${cardData.isNegative ? 'text-destructive' : ''}`}
        >
          {cardData.formattedBalance}
        </p>
        {cardData.balanceUsd && (
          <p
            className={`text-lg font-semibold tabular-nums mt-1 ${cardData.isBalanceUsdNegative ? 'text-destructive' : ''}`}
          >
            {cardData.balanceUsd}
            <span className="ml-1 text-sm font-normal text-muted-foreground">USD</span>
          </p>
        )}
      </div>

      {cardData.usagePercent !== null && (
        <div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${cardData.usagePercent}%` }}
            />
          </div>
          {cardData.creditLimitLabel && (
            <p className="text-xs text-muted-foreground mt-1">{cardData.creditLimitLabel}</p>
          )}
        </div>
      )}

      {cardData.loanProgress !== null && (
        <div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${cardData.loanProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {cardData.loanProgress.paid} de {cardData.loanProgress.total} cuotas
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const {
    product,
    isPending,
    isError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDelete,
    isDeleting,
  } = useProductDetail(productId);

  if (isPending) {
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
          <Skeleton className="h-5 w-32" />
        </div>
        <DetailSkeleton />
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
          <span className="font-medium">Producto</span>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No se encontro el producto o hubo un error al cargarlo.
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

  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  const metadataEntries = Object.entries(metadata).filter(
    ([, v]) => v !== undefined && v !== '' && v !== null,
  );
  const typeLabel = PRODUCT_TYPE_LABELS[product.type];
  const createdDate = new Date(product.createdAt).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver"
            onClick={() => router.history.back()}
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Button>
          <span className="font-medium">Detalle</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opciones del producto">
              <RiMoreLine className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/products/$productId/edit" params={{ productId }}>
                <RiEditLine className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <RiExchangeLine className="h-4 w-4 mr-2" />
              Importar transacciones
              <span className="ml-auto text-xs text-muted-foreground">Proximamente</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <RiDeleteBinLine className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {/* Hero */}
        <Card>
          <CardContent className="py-6">
            <HeroSection product={product} />
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="py-4">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Informacion del producto
            </span>
            <div className="mt-2">
              <InfoRow label="Nombre" value={product.name} />
              <InfoRow
                label="Institucion"
                value={product.institution !== 'N/A' ? product.institution : 'Billetera personal'}
              />
              <InfoRow label="Moneda" value={product.currency} />
              <InfoRow label="Creado" value={createdDate} />
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        {metadataEntries.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Detalles de {typeLabel.label}
              </span>
              <div className="mt-2">
                {metadataEntries.map(([key, value]) => {
                  const config = METADATA_FIELD_CONFIG[key];
                  return (
                    <InfoRow
                      key={key}
                      label={config?.label ?? key}
                      value={formatMetadataValue(key, value)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions placeholder */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <RiTimeLine className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Transacciones</p>
            <p className="text-xs text-muted-foreground">Proximamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente &quot;{product.name}
              &quot; y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
