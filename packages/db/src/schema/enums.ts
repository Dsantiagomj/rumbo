import {
  AMOUNT_TYPES,
  BUDGET_PERIODS,
  FREQUENCIES,
  PRODUCT_TYPES,
  REMINDER_CHANNELS,
  TRANSACTION_TYPES,
} from '@rumbo/shared/schemas';
import { pgEnum } from 'drizzle-orm/pg-core';

export const productTypeEnum = pgEnum('product_type', [...PRODUCT_TYPES]);
export const transactionTypeEnum = pgEnum('transaction_type', [...TRANSACTION_TYPES]);
export const budgetPeriodEnum = pgEnum('budget_period', [...BUDGET_PERIODS]);
export const amountTypeEnum = pgEnum('amount_type', [...AMOUNT_TYPES]);
export const frequencyEnum = pgEnum('frequency', [...FREQUENCIES]);
export const reminderChannelEnum = pgEnum('reminder_channel', [...REMINDER_CHANNELS]);
