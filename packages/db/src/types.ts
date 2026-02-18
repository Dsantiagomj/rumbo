import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { account, session, user, verification } from './schema/auth';
import type { budgets } from './schema/budgets';
import type { categories } from './schema/categories';
import type { savingsGoals } from './schema/goals';
import type { financialProducts } from './schema/products';
import type { recurringExpenses, reminders } from './schema/recurring';
import type { transactions } from './schema/transactions';

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export type Session = InferSelectModel<typeof session>;
export type NewSession = InferInsertModel<typeof session>;

export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;

export type Verification = InferSelectModel<typeof verification>;
export type NewVerification = InferInsertModel<typeof verification>;

export type FinancialProduct = InferSelectModel<typeof financialProducts>;
export type NewFinancialProduct = InferInsertModel<typeof financialProducts>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

export type Budget = InferSelectModel<typeof budgets>;
export type NewBudget = InferInsertModel<typeof budgets>;

export type RecurringExpense = InferSelectModel<typeof recurringExpenses>;
export type NewRecurringExpense = InferInsertModel<typeof recurringExpenses>;

export type Reminder = InferSelectModel<typeof reminders>;
export type NewReminder = InferInsertModel<typeof reminders>;

export type SavingsGoal = InferSelectModel<typeof savingsGoals>;
export type NewSavingsGoal = InferInsertModel<typeof savingsGoals>;
