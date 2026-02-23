import {
  boolean,
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { transactionTypeEnum } from './enums';
import { financialProducts } from './products';

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => financialProducts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  transferId: uuid('transfer_id'),
  type: transactionTypeEnum('type').notNull(),
  name: text('name').notNull(),
  merchant: text('merchant'),
  excluded: boolean('excluded').notNull().default(false),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  date: date('date', { mode: 'date' }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
