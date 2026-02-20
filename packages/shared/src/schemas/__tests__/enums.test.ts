import { describe, expect, it } from 'vitest';
import {
  amountTypeSchema,
  budgetPeriodSchema,
  CURRENCIES,
  currencySchema,
  frequencySchema,
  PRODUCT_TYPES,
  productTypeSchema,
  reminderChannelSchema,
  TRANSACTION_TYPES,
  transactionTypeSchema,
} from '../enums.js';

describe('enum constants', () => {
  it('PRODUCT_TYPES has 9 types', () => {
    expect(PRODUCT_TYPES).toHaveLength(9);
    expect(PRODUCT_TYPES).toContain('savings');
    expect(PRODUCT_TYPES).toContain('credit_card');
    expect(PRODUCT_TYPES).toContain('cash');
  });

  it('TRANSACTION_TYPES has 3 types', () => {
    expect(TRANSACTION_TYPES).toEqual(['income', 'expense', 'transfer']);
  });

  it('CURRENCIES has COP and USD', () => {
    expect(CURRENCIES).toEqual(['COP', 'USD']);
  });
});

describe('Zod schemas validate correctly', () => {
  it('productTypeSchema accepts valid types', () => {
    expect(productTypeSchema.safeParse('savings').success).toBe(true);
    expect(productTypeSchema.safeParse('invalid').success).toBe(false);
  });

  it('transactionTypeSchema accepts valid types', () => {
    expect(transactionTypeSchema.safeParse('income').success).toBe(true);
    expect(transactionTypeSchema.safeParse('invalid').success).toBe(false);
  });

  it('currencySchema accepts valid currencies', () => {
    expect(currencySchema.safeParse('COP').success).toBe(true);
    expect(currencySchema.safeParse('USD').success).toBe(true);
    expect(currencySchema.safeParse('EUR').success).toBe(false);
  });

  it('budgetPeriodSchema accepts valid periods', () => {
    expect(budgetPeriodSchema.safeParse('monthly').success).toBe(true);
    expect(budgetPeriodSchema.safeParse('daily').success).toBe(false);
  });

  it('frequencySchema accepts valid frequencies', () => {
    expect(frequencySchema.safeParse('biweekly').success).toBe(true);
    expect(frequencySchema.safeParse('daily').success).toBe(false);
  });

  it('reminderChannelSchema accepts valid channels', () => {
    expect(reminderChannelSchema.safeParse('push').success).toBe(true);
    expect(reminderChannelSchema.safeParse('sms').success).toBe(false);
  });

  it('amountTypeSchema accepts valid types', () => {
    expect(amountTypeSchema.safeParse('fixed').success).toBe(true);
    expect(amountTypeSchema.safeParse('dynamic').success).toBe(false);
  });
});
