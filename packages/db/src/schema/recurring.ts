import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { amountTypeEnum, frequencyEnum, reminderChannelEnum } from './enums';
import { financialProducts } from './products';

export const recurringExpenses = pgTable('recurring_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => financialProducts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  amountType: amountTypeEnum('amount_type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('COP'),
  dueDay: integer('due_day').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  recurringExpenseId: uuid('recurring_expense_id')
    .notNull()
    .references(() => recurringExpenses.id, { onDelete: 'cascade' }),
  daysBefore: integer('days_before').notNull(),
  channel: reminderChannelEnum('channel').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
