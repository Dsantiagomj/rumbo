import {
  AMOUNT_TYPES,
  BUDGET_PERIODS,
  FREQUENCIES,
  PRODUCT_TYPES,
  REMINDER_CHANNELS,
  TRANSACTION_TYPES,
} from '@rumbo/shared/schemas';
import { describe, expect, it } from 'vitest';
import {
  amountTypeEnum,
  budgetPeriodEnum,
  frequencyEnum,
  productTypeEnum,
  reminderChannelEnum,
  transactionTypeEnum,
} from '../enums.js';

describe('pgEnums match shared constants', () => {
  it('productTypeEnum matches PRODUCT_TYPES', () => {
    expect(productTypeEnum.enumValues).toEqual([...PRODUCT_TYPES]);
  });

  it('transactionTypeEnum matches TRANSACTION_TYPES', () => {
    expect(transactionTypeEnum.enumValues).toEqual([...TRANSACTION_TYPES]);
  });

  it('budgetPeriodEnum matches BUDGET_PERIODS', () => {
    expect(budgetPeriodEnum.enumValues).toEqual([...BUDGET_PERIODS]);
  });

  it('amountTypeEnum matches AMOUNT_TYPES', () => {
    expect(amountTypeEnum.enumValues).toEqual([...AMOUNT_TYPES]);
  });

  it('frequencyEnum matches FREQUENCIES', () => {
    expect(frequencyEnum.enumValues).toEqual([...FREQUENCIES]);
  });

  it('reminderChannelEnum matches REMINDER_CHANNELS', () => {
    expect(reminderChannelEnum.enumValues).toEqual([...REMINDER_CHANNELS]);
  });
});
