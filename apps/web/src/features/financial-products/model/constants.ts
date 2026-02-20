import type { RemixiconComponentType } from '@remixicon/react';
import {
  RiBankCardLine,
  RiBankLine,
  RiCashLine,
  RiHandCoinLine,
  RiLineChartLine,
} from '@remixicon/react';
import type { Currency, ProductResponse, ProductType } from '@rumbo/shared';

export const CURRENCY_LABELS: Record<Currency, string> = {
  COP: 'COP - Pesos Colombianos',
  USD: 'USD - Dolares',
};

export type ProductGroup = {
  key: string;
  label: string;
  types: ProductType[];
  icon: RemixiconComponentType;
};

export const PRODUCT_GROUPS: ProductGroup[] = [
  { key: 'accounts', label: 'Cuentas', types: ['savings', 'checking'], icon: RiBankLine },
  { key: 'cards', label: 'Tarjetas', types: ['credit_card'], icon: RiBankCardLine },
  {
    key: 'loans',
    label: 'Prestamos',
    types: ['loan_free_investment', 'loan_mortgage'],
    icon: RiHandCoinLine,
  },
  {
    key: 'investments',
    label: 'Inversiones',
    types: ['investment_cdt', 'investment_fund', 'investment_stock'],
    icon: RiLineChartLine,
  },
  { key: 'cash', label: 'Efectivo', types: ['cash'], icon: RiCashLine },
];

export function formatBalance(balance: string, currency: Currency): string {
  const value = Number.parseFloat(balance);
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(value);
}

export function getMetadataSnippet(product: ProductResponse): string | null {
  const meta = product.metadata as Record<string, unknown> | null;
  if (!meta) return null;

  switch (product.type) {
    case 'credit_card': {
      const last4 = meta.last4Digits as string | undefined;
      const limit = meta.creditLimit as string | undefined;
      if (!last4 || !limit) return null;
      return `**** ${last4} \u00B7 Cupo: ${formatBalance(limit, product.currency)}`;
    }

    case 'savings':
    case 'checking': {
      const accountNumber = meta.accountNumber as string | undefined;
      if (!accountNumber) return null;
      return `**** ${accountNumber}`;
    }

    case 'loan_free_investment':
    case 'loan_mortgage': {
      const monthlyPayment = meta.monthlyPayment as string | undefined;
      if (!monthlyPayment) return null;
      return `Cuota: ${formatBalance(monthlyPayment, product.currency)}/mes`;
    }

    case 'investment_cdt': {
      const maturityDate = meta.maturityDate as string | undefined;
      if (!maturityDate) return null;
      return `Vence: ${maturityDate}`;
    }

    default:
      return null;
  }
}
