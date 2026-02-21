import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiSearchLine,
} from '@remixicon/react';
import type { Currency } from '@rumbo/shared';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/shared/lib/useIsMobile';
import { Button, Input, Separator } from '@/shared/ui';
import { formatBalance } from '../model/constants';

type TransactionsSectionProps = {
  balance: string;
  currency: Currency;
  createdAt: string;
};

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
      <RiArrowDownSLine className="h-3.5 w-3.5" />
    </button>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-muted-foreground/60 hover:text-muted-foreground"
        >
          <RiInformationLine className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={4}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function SummaryRow({
  label,
  amount,
  bold,
  tooltip,
}: {
  label: string;
  amount: string;
  bold?: boolean;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <InfoTip text={tooltip} />
      <hr className={`grow border-dashed ${bold ? 'border-foreground/20' : 'border-border'}`} />
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''}`}>{amount}</span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium">{value}</span>
    </div>
  );
}

export function TransactionsSection({ balance, currency, createdAt }: TransactionsSectionProps) {
  const isMobile = useIsMobile();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const OPENING_BALANCE_ID = 'opening-balance';
  const allTransactionIds = [OPENING_BALANCE_ID];

  const hasSelection = selectedIds.size > 0;
  const isAllSelected =
    selectedIds.size === allTransactionIds.length && allTransactionIds.length > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allTransactionIds));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const formattedDate = new Date(createdAt).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedBalance = formatBalance(balance, currency);
  const zeroAmount = formatBalance('0', currency);
  const balanceValue = Number.parseFloat(balance);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Transacciones</h3>
        <Button size="sm" disabled>
          <RiAddLine className="h-3.5 w-3.5" />
          Nueva
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar transaccion..." className="pl-9" disabled />
        </div>
        <div className="flex gap-1.5">
          <FilterChip label="Categoria" />
          <FilterChip label="Tipo" />
          <FilterChip label="Fecha" />
        </div>
      </div>

      {/* Select all bar */}
      <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={toggleSelectAll}
          aria-label="Seleccionar todas las transacciones"
        />
        <span className="flex-1 text-xs font-medium text-muted-foreground">Seleccionar todas</span>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {allTransactionIds.length} transaccion{allTransactionIds.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Date group */}
      <div>
        {/* Date header with balance reconciliation */}
        <details className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-1 py-2 text-xs font-semibold text-muted-foreground">
            <p className="uppercase">
              <span>{formattedDate}</span>
              <span className="mx-1.5">&middot;</span>
              <span>1</span>
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold tabular-nums ${balanceValue < 0 ? 'text-destructive' : 'text-foreground'}`}
              >
                {formattedBalance}
              </span>
              <InfoTip text="Balance al final del dia, despues de todas las transacciones" />
              <RiArrowDownSLine className="h-4 w-4 transition-transform group-open:rotate-180" />
            </div>
          </summary>

          {/* Balance reconciliation */}
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 mb-2">
            <SummaryRow
              label="Balance inicial"
              amount={formattedBalance}
              tooltip="El balance de la cuenta al inicio del dia"
              bold
            />
            <SummaryRow
              label="Cargos"
              amount={zeroAmount}
              tooltip="Cargos y transacciones de salida durante el dia"
            />
            <SummaryRow
              label="Pagos"
              amount={zeroAmount}
              tooltip="Pagos y transacciones de entrada durante el dia"
            />
            <hr className="border-border" />
            <SummaryRow
              label="Balance final"
              amount={formattedBalance}
              tooltip="El balance final de la cuenta para el dia"
              bold
            />
          </div>
        </details>

        {/* Transaction cards */}
        <div className="space-y-2">
          {/* Opening balance card */}
          <div className="group relative rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedIds.has(OPENING_BALANCE_ID)}
                onCheckedChange={() => toggleSelection(OPENING_BALANCE_ID)}
                aria-label="Seleccionar Balance inicial"
                className="mt-0.5"
              />
              <button
                type="button"
                onClick={() => setIsDetailOpen(true)}
                className="cursor-pointer flex flex-1 items-start gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <RiAddLine className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">Balance inicial</p>
                    <p
                      className={`text-sm font-bold tabular-nums shrink-0 ${balanceValue < 0 ? 'text-destructive' : ''}`}
                    >
                      {formattedBalance}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <RiPriceTag3Line className="mr-1 h-2.5 w-2.5" />
                      Sin categoria
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Hover actions (desktop only) */}
            <div className="absolute top-3 right-3 hidden items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-sm md:group-hover:flex">
              <button
                type="button"
                disabled
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Editar"
              >
                <RiEditLine className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Eliminar"
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination (desktop only) */}
      <div className="hidden items-center justify-between pt-1 md:flex">
        <div className="flex items-center gap-1">
          <Button size="icon-xs" variant="ghost" disabled aria-label="Pagina anterior">
            <RiArrowLeftSLine className="h-3.5 w-3.5" />
          </Button>
          <div className="rounded-lg bg-muted p-0.5">
            <Button size="icon-xs" variant="outline" className="bg-background shadow-xs" disabled>
              1
            </Button>
          </div>
          <Button size="icon-xs" variant="ghost" disabled aria-label="Pagina siguiente">
            <RiArrowRightSLine className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button size="sm" variant="outline" disabled>
          10
          <RiArrowDownSLine className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Floating selection bar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 z-50 flex w-[90%] -translate-x-1/2 items-center justify-between rounded-xl bg-foreground px-4 py-2.5 text-sm text-background md:w-[420px]">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={true}
              onCheckedChange={clearSelection}
              className="border-background/30 data-checked:bg-background data-checked:text-foreground data-checked:border-background"
            />
            <span>
              {selectedIds.size} transaccion{selectedIds.size !== 1 ? 'es' : ''} seleccionada
              {selectedIds.size !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-background/20"
            aria-label="Eliminar seleccionadas"
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {selectedIds.size} transaccion{selectedIds.size !== 1 ? 'es' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Las transacciones seleccionadas seran eliminadas
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" disabled>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction detail sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'}>
          <SheetHeader>
            <SheetTitle>Balance inicial</SheetTitle>
            <SheetDescription className="sr-only">Detalles de la transaccion</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6 space-y-4">
            {/* Amount */}
            <div className="text-center py-2">
              <p
                className={`text-2xl font-bold tabular-nums ${balanceValue < 0 ? 'text-destructive' : ''}`}
              >
                {formattedBalance}
              </p>
            </div>

            <Separator />

            {/* Details */}
            <div>
              <DetailRow
                icon={<RiCalendarLine className="h-4 w-4" />}
                label="Fecha"
                value={formattedDate}
              />
              <DetailRow
                icon={<RiPriceTag3Line className="h-4 w-4" />}
                label="Categoria"
                value="Sin categoria"
              />
            </div>

            <Separator />

            {/* Edit action */}
            <Button variant="outline" className="w-full" disabled>
              <RiEditLine className="h-4 w-4" />
              Editar transaccion
            </Button>

            <Separator />

            {/* Delete section (Maybe-style settings) */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Eliminar transaccion</p>
                <p className="text-xs text-muted-foreground">
                  Eliminar permanentemente esta transaccion
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
