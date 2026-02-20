import { relations } from 'drizzle-orm';
import { account, session, user } from './auth';
import { budgets } from './budgets';
import { categories } from './categories';
import { savingsGoals } from './goals';
import { financialProducts } from './products';
import { recurringExpenses, reminders } from './recurring';
import { transactions } from './transactions';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  financialProducts: many(financialProducts),
  categories: many(categories),
  budgets: many(budgets),
  savingsGoals: many(savingsGoals),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const financialProductRelations = relations(financialProducts, ({ one, many }) => ({
  user: one(user, { fields: [financialProducts.userId], references: [user.id] }),
  transactions: many(transactions),
  recurringExpenses: many(recurringExpenses),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, { fields: [categories.userId], references: [user.id] }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, { relationName: 'parentChild' }),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringExpenses: many(recurringExpenses),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  product: one(financialProducts, {
    fields: [transactions.productId],
    references: [financialProducts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetRelations = relations(budgets, ({ one }) => ({
  user: one(user, { fields: [budgets.userId], references: [user.id] }),
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export const recurringExpenseRelations = relations(recurringExpenses, ({ one, many }) => ({
  product: one(financialProducts, {
    fields: [recurringExpenses.productId],
    references: [financialProducts.id],
  }),
  category: one(categories, {
    fields: [recurringExpenses.categoryId],
    references: [categories.id],
  }),
  reminders: many(reminders),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  recurringExpense: one(recurringExpenses, {
    fields: [reminders.recurringExpenseId],
    references: [recurringExpenses.id],
  }),
}));

export const savingsGoalRelations = relations(savingsGoals, ({ one }) => ({
  user: one(user, { fields: [savingsGoals.userId], references: [user.id] }),
}));
