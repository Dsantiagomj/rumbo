import { RiAlertLine, RiArrowLeftLine, RiExchangeLine } from '@remixicon/react';
import { DatePickerField } from '@/features/transactions/ui/components';
import { Button, Card, CardContent, Input, Separator, Skeleton } from '@/shared/ui';
import { TransferProductPicker } from './TransferProductPicker';
import { useCreateTransfer } from './useCreateTransfer';

export function CreateTransferForm() {
  const {
    form,
    products,
    isProductsPending,
    sourceCurrency,
    isCrossCurrency,
    trmData,
    isTrmPending,
    isTrmError,
    previewAmount,
    mutation,
    handleSubmit,
    goBack,
  } = useCreateTransfer();

  if (isProductsPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" aria-label="Volver" onClick={goBack}>
            <RiArrowLeftLine className="h-5 w-5" />
          </Button>
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" aria-label="Volver" onClick={goBack}>
            <RiArrowLeftLine className="h-5 w-5" />
          </Button>
          <span className="font-medium">Nueva transferencia</span>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Necesitas al menos dos productos para hacer una transferencia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sourceProductId = form.watch('sourceProductId');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" aria-label="Volver" onClick={goBack}>
          <RiArrowLeftLine className="h-5 w-5" />
        </Button>
        <span className="font-medium">Nueva transferencia</span>
      </div>

      <Card>
        <CardContent className="py-6">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4">
              {/* Source product */}
              <TransferProductPicker
                id="transfer-source"
                products={products}
                value={form.watch('sourceProductId')}
                onChange={(id) => form.setValue('sourceProductId', id, { shouldValidate: true })}
                label="Cuenta origen"
                placeholder="Seleccionar origen"
              />
              {form.formState.errors.sourceProductId && (
                <p className="text-sm text-destructive -mt-2">
                  {form.formState.errors.sourceProductId.message}
                </p>
              )}

              {/* Direction icon */}
              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <RiExchangeLine className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              </div>

              {/* Destination product */}
              <TransferProductPicker
                id="transfer-destination"
                products={products}
                value={form.watch('destinationProductId')}
                onChange={(id) =>
                  form.setValue('destinationProductId', id, {
                    shouldValidate: true,
                  })
                }
                excludeId={sourceProductId}
                label="Cuenta destino"
                placeholder="Seleccionar destino"
              />
              {form.formState.errors.destinationProductId && (
                <p className="text-sm text-destructive -mt-2">
                  {form.formState.errors.destinationProductId.message}
                </p>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <label htmlFor="transfer-amount" className="text-sm font-medium">
                  Monto
                </label>
                <div className="flex gap-2">
                  <Input
                    id="transfer-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="flex-1"
                    {...form.register('amount')}
                  />
                  {sourceCurrency && (
                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                      {sourceCurrency}
                    </span>
                  )}
                </div>
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {/* Cross-currency preview */}
              {isCrossCurrency && (
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                  {isTrmPending ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  ) : isTrmError ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <RiAlertLine className="h-4 w-4 shrink-0" />
                        <span>No se pudo obtener la TRM. Ingresa la tasa manualmente.</span>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="transfer-exchange-rate" className="text-sm font-medium">
                          Tasa de cambio (1 USD = X COP)
                        </label>
                        <Input
                          id="transfer-exchange-rate"
                          type="text"
                          inputMode="decimal"
                          placeholder="Ej: 4150.50"
                          {...form.register('exchangeRate')}
                        />
                        {form.formState.errors.exchangeRate && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.exchangeRate.message}
                          </p>
                        )}
                      </div>
                      {previewAmount && (
                        <p className="text-sm text-muted-foreground">
                          {previewAmount.formattedSource} ≈ {previewAmount.formattedDest}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        TRM: 1 USD ={' '}
                        {Number.parseFloat(trmData?.rate ?? '0').toLocaleString('es-CO')} COP
                        <span className="ml-1 text-[10px]">({trmData?.source})</span>
                      </p>
                      {previewAmount && (
                        <p className="text-sm font-medium">
                          {previewAmount.formattedSource} ≈ {previewAmount.formattedDest}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Fecha</span>
                <DatePickerField
                  id="transfer-date"
                  value={form.watch('date')}
                  onChange={(value) => form.setValue('date', value, { shouldValidate: true })}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="transfer-notes" className="text-sm font-medium">
                  Notas
                </label>
                <textarea
                  id="transfer-notes"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Notas adicionales..."
                  {...form.register('notes')}
                />
                {form.formState.errors.notes && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear Transferencia'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
