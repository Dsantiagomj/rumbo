import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExchangeLine,
  RiInformationLine,
  RiMoreLine,
} from '@remixicon/react';
import type { ProductResponse } from '@rumbo/shared';
import { Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
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
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/shared/lib/useIsMobile';
import { Button, Card, CardContent, Separator, Skeleton } from '@/shared/ui';
import { PRODUCT_GROUPS } from '../model/constants';
import { METADATA_FIELD_CONFIG, PRODUCT_TYPE_LABELS } from '../model/form-schemas';
import { TransactionsSection } from './TransactionsSection';
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
    </div>
  );
}

function ProductInfoContent({
  product,
  metadataEntries,
  typeLabel,
  createdDate,
}: {
  product: ProductResponse;
  metadataEntries: [string, unknown][];
  typeLabel: string;
  createdDate: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Informacion general
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
      </div>

      {metadataEntries.length > 0 && (
        <div>
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Detalles de {typeLabel}
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
        </div>
      )}
    </div>
  );
}

function HeroSection({
  product,
  productId,
  isInfoOpen,
  onToggleInfo,
  onDeleteClick,
  metadataEntries,
  typeLabel,
  createdDate,
}: {
  product: ProductResponse;
  productId: string;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
  onDeleteClick: () => void;
  metadataEntries: [string, unknown][];
  typeLabel: string;
  createdDate: string;
}) {
  const isMobile = useIsMobile();
  const cardData = useProductCard(product);
  const group = PRODUCT_GROUPS.find((g) => g.types.includes(product.type));
  const productTypeLabel = PRODUCT_TYPE_LABELS[product.type];
  const GroupIcon = group?.icon;

  return (
    <Card>
      <CardContent className="py-6">
        {/* Top: product info + action buttons */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {GroupIcon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <GroupIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{productTypeLabel.label}</p>
              <p className="font-semibold text-lg truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {product.institution !== 'N/A' ? product.institution : 'Billetera personal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Informacion del producto"
              onClick={onToggleInfo}
            >
              <RiInformationLine className="h-5 w-5" />
            </Button>

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
                <DropdownMenuItem variant="destructive" onClick={onDeleteClick}>
                  <RiDeleteBinLine className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Balance */}
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

        {/* Credit card progress */}
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

        {/* Loan progress */}
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

        {/* Collapsible info section (desktop only) */}
        {!isMobile && (
          <Collapsible open={isInfoOpen} onOpenChange={onToggleInfo}>
            <CollapsibleContent>
              <Separator className="my-4" />
              <ProductInfoContent
                product={product}
                metadataEntries={metadataEntries}
                typeLabel={typeLabel}
                createdDate={createdDate}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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
      <div className="flex items-center gap-2 mb-6">
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

      <div className="space-y-4">
        {/* Hero card with actions + collapsible info */}
        <HeroSection
          product={product}
          productId={productId}
          isInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen((prev) => !prev)}
          onDeleteClick={() => setIsDeleteDialogOpen(true)}
          metadataEntries={metadataEntries}
          typeLabel={typeLabel.label}
          createdDate={createdDate}
        />

        {/* Transactions */}
        <TransactionsSection
          balance={product.balance}
          currency={product.currency}
          createdAt={product.createdAt}
        />
      </div>

      {/* Info sheet (mobile only) */}
      {isMobile && (
        <Sheet open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Informacion del producto</SheetTitle>
              <SheetDescription className="sr-only">
                Detalles y metadata del producto financiero
              </SheetDescription>
            </SheetHeader>
            <div className="px-6 pb-6">
              <ProductInfoContent
                product={product}
                metadataEntries={metadataEntries}
                typeLabel={typeLabel.label}
                createdDate={createdDate}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

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
