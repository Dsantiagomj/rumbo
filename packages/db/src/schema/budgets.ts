import { numeric, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { categories } from './categories';
import { budgetPeriodEnum } from './enums';

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('COP'),
    period: budgetPeriodEnum('period').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('budget_user_category_period').on(table.userId, table.categoryId, table.period),
  ],
);
