import type { RemixiconComponentType } from '@remixicon/react';
import {
  RiBankCardLine,
  RiBankLine,
  RiCashLine,
  RiHandCoinLine,
  RiLineChartLine,
} from '@remixicon/react';
import type { Currency, ProductType } from '@rumbo/shared';

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
