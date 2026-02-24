import { RiEditLine } from '@remixicon/react';
import type { Currency } from '@rumbo/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatBalance, PRODUCT_GROUPS } from '../model/constants';
import {
  METADATA_FIELD_CONFIG,
  PRODUCT_TYPE_LABELS,
  type ProductFormReturn,
} from '../model/form-schemas';

type ReviewStepProps = {
  form: ProductFormReturn;
  onEditStep: (step: number) => void;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

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

export function ReviewStep({ form, onEditStep }: ReviewStepProps) {
  const values = form.getValues();
  const group = PRODUCT_GROUPS.find((g) => g.types.includes(values.type));
  const typeLabel = PRODUCT_TYPE_LABELS[values.type];
  const metadata = (values.metadata ?? {}) as Record<string, unknown>;
  const metadataEntries = Object.entries(metadata).filter(
    ([k, v]) => v !== undefined && v !== '' && v !== null && k !== 'balanceUsd',
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {group && <group.icon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{typeLabel.label}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(0)}>
            <RiEditLine className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Informacion basica
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(1)}>
              <RiEditLine className="mr-1 h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
          {values.type !== 'cash' && (
            <>
              <ReviewRow label="Nombre" value={values.name} />
              <ReviewRow label="Institucion" value={values.institution} />
            </>
          )}
          <ReviewRow
            label={
              values.type === 'cash'
                ? 'Saldo en pesos (COP)'
                : values.type === 'credit_card'
                  ? 'Saldo consumido (COP)'
                  : values.type === 'loan_free_investment' || values.type === 'loan_mortgage'
                    ? 'Deuda actual'
                    : 'Saldo'
            }
            value={formatBalance(values.balance, values.currency as Currency)}
          />
          {(values.type === 'cash' || (values.type === 'credit_card' && metadata.balanceUsd)) &&
          metadata.balanceUsd ? (
            <ReviewRow
              label={values.type === 'cash' ? 'Saldo en dolares (USD)' : 'Saldo consumido (USD)'}
              value={formatBalance(String(metadata.balanceUsd), 'USD' as Currency)}
            />
          ) : values.type !== 'cash' ? (
            <ReviewRow label="Moneda" value={values.currency} />
          ) : null}
        </div>

        {metadataEntries.length > 0 && (
          <>
            <Separator />
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Detalles de {typeLabel.label}
              </span>
              {metadataEntries.map(([key, value]) => {
                const config = METADATA_FIELD_CONFIG[key];
                return (
                  <ReviewRow
                    key={key}
                    label={config?.label ?? key}
                    value={formatMetadataValue(key, value)}
                  />
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
