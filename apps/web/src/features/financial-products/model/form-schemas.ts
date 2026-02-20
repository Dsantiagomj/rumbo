import type { ProductType } from '@rumbo/shared';
import { createProductSchema, PRODUCT_TYPE_METADATA_MAP } from '@rumbo/shared';
import { z } from 'zod';

export const createProductFormSchema = createProductSchema
  .extend({
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((data, ctx) => {
    const metadataSchema = PRODUCT_TYPE_METADATA_MAP[data.type];
    const result = metadataSchema.safeParse(data.metadata);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ['metadata', ...issue.path] });
      }
    }
  });

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>;

export const PRODUCT_TYPE_LABELS: Record<ProductType, { label: string; description: string }> = {
  savings: { label: 'Cuenta de Ahorros', description: 'Cuenta bancaria para ahorros' },
  checking: { label: 'Cuenta Corriente', description: 'Cuenta bancaria corriente' },
  credit_card: { label: 'Tarjeta de Credito', description: 'Tarjeta de credito bancaria' },
  loan_free_investment: {
    label: 'Prestamo Libre Inversion',
    description: 'Credito de libre inversion',
  },
  loan_mortgage: { label: 'Credito Hipotecario', description: 'Prestamo para vivienda' },
  investment_cdt: { label: 'CDT', description: 'Certificado de Deposito a Termino' },
  investment_fund: { label: 'Fondo de Inversion', description: 'Fondo de inversion colectiva' },
  investment_stock: { label: 'Acciones', description: 'Inversion en acciones' },
  cash: { label: 'Efectivo', description: 'Dinero en efectivo' },
};

export type MetadataFieldConfig = {
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
};

export const METADATA_FIELD_CONFIG: Record<string, MetadataFieldConfig> = {
  accountNumber: { label: 'Ultimos 4 digitos', placeholder: '1234', type: 'text' },
  gmfExempt: { label: 'Exenta de GMF (4x1000)', placeholder: '', type: 'boolean' },
  interestRate: { label: 'Tasa de interes (%)', placeholder: '4.5', type: 'text' },
  last4Digits: { label: 'Ultimos 4 digitos', placeholder: '1234', type: 'text' },
  creditLimit: { label: 'Cupo total', placeholder: '5000000', type: 'text' },
  cutoffDay: { label: 'Dia de corte', placeholder: '15', type: 'number' },
  paymentDueDay: { label: 'Dia de pago', placeholder: '5', type: 'number' },
  network: {
    label: 'Red / Franquicia',
    placeholder: '',
    type: 'select',
    options: [
      { value: 'visa', label: 'Visa' },
      { value: 'mastercard', label: 'Mastercard' },
      { value: 'amex', label: 'American Express' },
      { value: 'diners', label: 'Diners Club' },
      { value: 'none', label: 'Sin franquicia' },
    ],
  },
  balanceUsd: { label: 'Saldo consumido (USD)', placeholder: '0.00', type: 'text' },
  monthlyPayment: { label: 'Cuota mensual', placeholder: '500000', type: 'text' },
  totalTerm: { label: 'Plazo total (meses)', placeholder: '60', type: 'number' },
  remainingTerm: { label: 'Plazo restante (meses)', placeholder: '48', type: 'number' },
  originalAmount: { label: 'Monto total', placeholder: '10000000', type: 'text' },
  startDate: { label: 'Fecha de inicio', placeholder: '', type: 'date' },
  maturityDate: { label: 'Fecha de vencimiento', placeholder: '', type: 'date' },
  autoRenewal: { label: 'Renovacion automatica', placeholder: '', type: 'boolean' },
  units: { label: 'Unidades/acciones', placeholder: '100', type: 'number' },
  broker: { label: 'Corredor/Intermediario', placeholder: 'tyba', type: 'text' },
};
