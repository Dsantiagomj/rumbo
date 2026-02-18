import { z } from 'zod';

export const PRODUCT_TYPES = [
  'savings',
  'checking',
  'credit_card',
  'loan_free_investment',
  'loan_mortgage',
  'investment_cdt',
  'investment_fund',
  'investment_stock',
  'cash',
] as const;

export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;

export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const;

export const AMOUNT_TYPES = ['fixed', 'variable'] as const;

export const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;

export const REMINDER_CHANNELS = ['email', 'push', 'in_app'] as const;

export const CURRENCIES = ['COP', 'USD'] as const;

export const productTypeSchema = z.enum(PRODUCT_TYPES);
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export const budgetPeriodSchema = z.enum(BUDGET_PERIODS);
export const amountTypeSchema = z.enum(AMOUNT_TYPES);
export const frequencySchema = z.enum(FREQUENCIES);
export const reminderChannelSchema = z.enum(REMINDER_CHANNELS);
export const currencySchema = z.enum(CURRENCIES);

export type ProductType = z.infer<typeof productTypeSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;
export type AmountType = z.infer<typeof amountTypeSchema>;
export type Frequency = z.infer<typeof frequencySchema>;
export type ReminderChannel = z.infer<typeof reminderChannelSchema>;
export type Currency = z.infer<typeof currencySchema>;
