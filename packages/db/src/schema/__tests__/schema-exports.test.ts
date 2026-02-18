import { describe, expect, it } from 'vitest';
import * as schema from '../index.js';

describe('schema exports', () => {
  it('exports all enums', () => {
    expect(schema.productTypeEnum).toBeDefined();
    expect(schema.transactionTypeEnum).toBeDefined();
    expect(schema.budgetPeriodEnum).toBeDefined();
    expect(schema.amountTypeEnum).toBeDefined();
    expect(schema.frequencyEnum).toBeDefined();
    expect(schema.reminderChannelEnum).toBeDefined();
  });

  it('exports auth tables', () => {
    expect(schema.user).toBeDefined();
    expect(schema.session).toBeDefined();
    expect(schema.account).toBeDefined();
    expect(schema.verification).toBeDefined();
  });

  it('exports domain tables', () => {
    expect(schema.financialProducts).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.transactions).toBeDefined();
    expect(schema.budgets).toBeDefined();
    expect(schema.recurringExpenses).toBeDefined();
    expect(schema.reminders).toBeDefined();
    expect(schema.savingsGoals).toBeDefined();
  });

  it('exports all relations', () => {
    expect(schema.userRelations).toBeDefined();
    expect(schema.sessionRelations).toBeDefined();
    expect(schema.accountRelations).toBeDefined();
    expect(schema.financialProductRelations).toBeDefined();
    expect(schema.categoryRelations).toBeDefined();
    expect(schema.transactionRelations).toBeDefined();
    expect(schema.budgetRelations).toBeDefined();
    expect(schema.recurringExpenseRelations).toBeDefined();
    expect(schema.reminderRelations).toBeDefined();
    expect(schema.savingsGoalRelations).toBeDefined();
  });
});
