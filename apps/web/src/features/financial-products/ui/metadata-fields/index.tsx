import type { ProductType } from '@rumbo/shared';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateProductFormValues } from '../../model/form-schemas';
import { AccountMetadataFields } from './AccountMetadataFields';
import { CdtMetadataFields } from './CdtMetadataFields';
import { CreditCardMetadataFields } from './CreditCardMetadataFields';
import { InvestmentMetadataFields } from './InvestmentMetadataFields';
import { LoanMetadataFields } from './LoanMetadataFields';

export type MetadataRendererProps = {
  form: UseFormReturn<CreateProductFormValues>;
};

const METADATA_RENDERERS: Partial<Record<ProductType, React.ComponentType<MetadataRendererProps>>> =
  {
    savings: AccountMetadataFields,
    checking: AccountMetadataFields,
    credit_card: CreditCardMetadataFields,
    loan_free_investment: LoanMetadataFields,
    loan_mortgage: LoanMetadataFields,
    investment_cdt: CdtMetadataFields,
    investment_fund: InvestmentMetadataFields,
    investment_stock: InvestmentMetadataFields,
  };

type MetadataFieldsProps = {
  type: ProductType;
  form: UseFormReturn<CreateProductFormValues>;
};

export function MetadataFields({ type, form }: MetadataFieldsProps) {
  const Renderer = METADATA_RENDERERS[type];
  if (!Renderer) return null;
  return <Renderer form={form} />;
}
