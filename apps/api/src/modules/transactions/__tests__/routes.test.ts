import { randomUUID } from 'node:crypto';
import * as schema from '@rumbo/db/schema';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// -- Mock declarations BEFORE any dynamic import --

let testAuth: ReturnType<typeof betterAuth>;
let testDb: ReturnType<typeof drizzle>;

vi.mock('../../../lib/auth.js', () => ({
  getAuth: () => testAuth,
  pendingEmailPromises: [],
}));

vi.mock('../../../lib/db.js', () => ({
  createDb: () => testDb,
}));

// -- Dynamic import AFTER mocks --
const { app } = await import('../../../app.js');

// -- Types --

type TransactionResponse = {
  id: string;
  productId: string;
  categoryId: string | null;
  transferId: string | null;
  type: string;
  name: string;
  merchant: string | null;
  excluded: boolean;
  amount: string;
  currency: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type TransactionListResponse = {
  transactions: TransactionResponse[];
  nextCursor: string | null;
};

type ErrorBody = {
  error: {
    message: string;
    code: string;
    status: number;
    details?: { path: (string | number)[]; message: string }[];
  };
};

type ProductResponse = {
  id: string;
  userId: string;
  type: string;
  name: string;
  institution: string;
  balance: string;
  currency: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

// -- Test setup --

describe('Transactions API', () => {
  let db: InstanceType<typeof Database>;
  let sessionCookie: string;
  let testProductId: string;

  const postJson = (path: string, body: Record<string, unknown>) =>
    app.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(body),
    });

  const putJson = (path: string, body: Record<string, unknown>) =>
    app.request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(body),
    });

  const getAuthed = (path: string) => app.request(path, { headers: { Cookie: sessionCookie } });

  const deleteAuthed = (path: string) =>
    app.request(path, { method: 'DELETE', headers: { Cookie: sessionCookie } });

  beforeAll(async () => {
    db = new Database(':memory:');

    db.function('gen_random_uuid', () => randomUUID());
    db.function('now', () => new Date().toISOString());

    const origPrepare = db.prepare.bind(db);
    // biome-ignore lint/suspicious/noExplicitAny: patching better-sqlite3 internals for boolean→int and ILIKE→LIKE conversion
    (db as any).prepare = (sql: string) => {
      const adjustedSql = sql.replace(/\bILIKE\b/gi, 'LIKE');
      const stmt = origPrepare(adjustedSql);
      const patchFn =
        (fn: (...args: unknown[]) => unknown) =>
        (...args: unknown[]) =>
          fn(...args.map((a) => (typeof a === 'boolean' ? (a ? 1 : 0) : a)));
      stmt.run = patchFn(stmt.run.bind(stmt)) as typeof stmt.run;
      stmt.get = patchFn(stmt.get.bind(stmt)) as typeof stmt.get;
      stmt.all = patchFn(stmt.all.bind(stmt)) as typeof stmt.all;
      return stmt;
    };

    const config = {
      database: db,
      secret: 'test-secret-that-is-at-least-32-characters-long!!',
      baseURL: 'http://localhost:3000',
      emailAndPassword: { enabled: true },
    };

    const { runMigrations } = await getMigrations(config);
    await runMigrations();

    testAuth = betterAuth(config);

    db.exec(`
      CREATE TABLE IF NOT EXISTS financial_products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        institution TEXT NOT NULL,
        balance TEXT NOT NULL DEFAULT '0',
        currency TEXT NOT NULL DEFAULT 'COP',
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        product_id TEXT NOT NULL,
        category_id TEXT,
        transfer_id TEXT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        merchant TEXT,
        excluded INTEGER NOT NULL DEFAULT 0,
        amount TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'COP',
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES financial_products(id) ON DELETE CASCADE
      )
    `);

    testDb = drizzle(db, { schema });

    const signUpRes = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'securepassword123',
      }),
    });

    const setCookies = signUpRes.headers.getSetCookie();
    sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    const productRes = await postJson('/api/financial-products', {
      type: 'savings',
      name: 'Test Savings Account',
      institution: 'Bancolombia',
      balance: '0',
      currency: 'COP',
    });

    expect(productRes.status).toBe(201);
    const product = (await productRes.json()) as ProductResponse;
    testProductId = product.id;
  });

  afterAll(() => {
    db.close();
  });

  // ============================================================
  // POST /api/financial-products/:productId/transactions
  // ============================================================

  describe('POST /api/financial-products/:productId/transactions', () => {
    it('creates an income transaction (201)', async () => {
      const res = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'income',
        name: 'Monthly Salary',
        amount: '5000000.00',
        currency: 'COP',
        date: '2024-03-15',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransactionResponse;
      expect(body.id).toBeDefined();
      expect(body.productId).toBe(testProductId);
      expect(body.type).toBe('income');
      expect(body.name).toBe('Monthly Salary');
      expect(body.amount).toBe('5000000.00');
      expect(body.currency).toBe('COP');
      expect(body.date).toBe('2024-03-15');
      expect(body.merchant).toBeNull();
      expect(body.notes).toBeNull();
      expect(body.categoryId).toBeNull();
      expect(body.transferId).toBeNull();
      expect(body.excluded).toBe(false);
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('creates an expense transaction with merchant and notes (201)', async () => {
      const res = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'expense',
        name: 'Grocery Shopping',
        merchant: 'Exito Supermarket',
        amount: '150000.50',
        currency: 'COP',
        date: '2024-03-16',
        notes: 'Weekly groceries',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransactionResponse;
      expect(body.type).toBe('expense');
      expect(body.name).toBe('Grocery Shopping');
      expect(body.merchant).toBe('Exito Supermarket');
      expect(body.amount).toBe('150000.50');
      expect(body.notes).toBe('Weekly groceries');
    });

    it('returns 404 for non-existent productId', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await postJson(`/api/financial-products/${fakeId}/transactions`, {
        type: 'income',
        name: 'Test',
        amount: '100.00',
        currency: 'COP',
        date: '2024-03-15',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Financial product not found');
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request(`/api/financial-products/${testProductId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          name: 'Test',
          amount: '100.00',
          currency: 'COP',
          date: '2024-03-15',
        }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 422 for invalid body (empty name)', async () => {
      const res = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'income',
        name: '',
        amount: '100.00',
        currency: 'COP',
        date: '2024-03-15',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for invalid amount format', async () => {
      const res = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'income',
        name: 'Bad Amount',
        amount: '100.123',
        currency: 'COP',
        date: '2024-03-15',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================
  // GET /api/financial-products/:productId/transactions
  // ============================================================

  describe('GET /api/financial-products/:productId/transactions', () => {
    it('returns list of transactions (200)', async () => {
      const res = await getAuthed(`/api/financial-products/${testProductId}/transactions`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(Array.isArray(body.transactions)).toBe(true);
      expect(body.transactions.length).toBeGreaterThanOrEqual(2);
      expect(body).toHaveProperty('nextCursor');
    });

    it('returns 404 for non-existent productId', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await getAuthed(`/api/financial-products/${fakeId}/transactions`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request(`/api/financial-products/${testProductId}/transactions`);

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // GET /api/financial-products/:productId/transactions (Pagination)
  // ============================================================

  describe('GET /api/financial-products/:productId/transactions (Pagination)', () => {
    let paginationProductId: string;

    beforeAll(async () => {
      const productRes = await postJson('/api/financial-products', {
        type: 'checking',
        name: 'Pagination Test Account',
        institution: 'Test Bank',
        balance: '0',
        currency: 'COP',
      });

      expect(productRes.status).toBe(201);
      const product = (await productRes.json()) as ProductResponse;
      paginationProductId = product.id;

      for (let i = 1; i <= 30; i++) {
        const day = String(i).padStart(2, '0');
        await postJson(`/api/financial-products/${paginationProductId}/transactions`, {
          type: i % 3 === 0 ? 'income' : 'expense',
          name: `Transaction ${i}`,
          amount: `${i * 1000}.00`,
          currency: 'COP',
          date: `2024-01-${day}`,
        });
      }
    });

    it('returns 25 items by default with a non-null nextCursor', async () => {
      const res = await getAuthed(`/api/financial-products/${paginationProductId}/transactions`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(25);
      expect(body.nextCursor).not.toBeNull();
    });

    it('returns remaining items with null nextCursor when using cursor', async () => {
      const firstRes = await getAuthed(
        `/api/financial-products/${paginationProductId}/transactions`,
      );

      expect(firstRes.status).toBe(200);
      const firstPage = (await firstRes.json()) as TransactionListResponse;
      expect(firstPage.nextCursor).not.toBeNull();

      const secondRes = await getAuthed(
        `/api/financial-products/${paginationProductId}/transactions?cursor=${firstPage.nextCursor}`,
      );

      expect(secondRes.status).toBe(200);
      const secondPage = (await secondRes.json()) as TransactionListResponse;
      expect(secondPage.transactions.length).toBe(5);
      expect(secondPage.nextCursor).toBeNull();
    });

    it('returns custom limit items with nextCursor', async () => {
      const res = await getAuthed(
        `/api/financial-products/${paginationProductId}/transactions?limit=5`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(5);
      expect(body.nextCursor).not.toBeNull();
    });

    it('returns transactions ordered by date descending (newest first)', async () => {
      const res = await getAuthed(
        `/api/financial-products/${paginationProductId}/transactions?limit=30`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;

      for (let i = 1; i < body.transactions.length; i++) {
        const current = body.transactions[i]?.date ?? '';
        const previous = body.transactions[i - 1]?.date ?? '';
        expect(previous >= current).toBe(true);
      }
    });
  });

  // ============================================================
  // GET /api/financial-products/:productId/transactions (Filters)
  // ============================================================

  describe('GET /api/financial-products/:productId/transactions (Filters)', () => {
    let filterProductId: string;

    beforeAll(async () => {
      const productRes = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Filter Test Account',
        institution: 'Filter Bank',
        balance: '0',
        currency: 'COP',
      });

      expect(productRes.status).toBe(201);
      const product = (await productRes.json()) as ProductResponse;
      filterProductId = product.id;

      await postJson(`/api/financial-products/${filterProductId}/transactions`, {
        type: 'income',
        name: 'Salary Payment',
        merchant: 'Employer Corp',
        amount: '5000000.00',
        currency: 'COP',
        date: '2024-02-01',
      });

      await postJson(`/api/financial-products/${filterProductId}/transactions`, {
        type: 'expense',
        name: 'Restaurant Dinner',
        merchant: 'Crepes & Waffles',
        amount: '85000.00',
        currency: 'COP',
        date: '2024-02-10',
      });

      await postJson(`/api/financial-products/${filterProductId}/transactions`, {
        type: 'expense',
        name: 'Gas Station',
        merchant: 'Terpel',
        amount: '120000.00',
        currency: 'COP',
        date: '2024-03-05',
      });

      await postJson(`/api/financial-products/${filterProductId}/transactions`, {
        type: 'income',
        name: 'Freelance Project',
        amount: '2000000.00',
        currency: 'COP',
        date: '2024-03-15',
      });
    });

    it('filters by type (income only)', async () => {
      const res = await getAuthed(
        `/api/financial-products/${filterProductId}/transactions?types=income`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(2);
      for (const tx of body.transactions) {
        expect(tx.type).toBe('income');
      }
    });

    it('filters by date range', async () => {
      const res = await getAuthed(
        `/api/financial-products/${filterProductId}/transactions?start_date=2024-02-01&end_date=2024-02-28`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(2);
      for (const tx of body.transactions) {
        expect(tx.date >= '2024-02-01').toBe(true);
        expect(tx.date <= '2024-02-28').toBe(true);
      }
    });

    it('filters by search (merchant name)', async () => {
      const res = await getAuthed(
        `/api/financial-products/${filterProductId}/transactions?search=Crepes`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(1);
      expect(body.transactions[0]?.merchant).toBe('Crepes & Waffles');
    });

    it('filters by amount range', async () => {
      const res = await getAuthed(
        `/api/financial-products/${filterProductId}/transactions?amount_min=100000&amount_max=200000`,
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionListResponse;
      expect(body.transactions.length).toBe(1);
      expect(body.transactions[0]?.name).toBe('Gas Station');
    });
  });

  // ============================================================
  // GET /api/transactions/:id
  // ============================================================

  describe('GET /api/transactions/:id', () => {
    it('returns a single transaction by ID (200)', async () => {
      const createRes = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'expense',
        name: 'Detail Test Transaction',
        amount: '50000.00',
        currency: 'COP',
        date: '2024-04-01',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as TransactionResponse;

      const res = await getAuthed(`/api/transactions/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Detail Test Transaction');
      expect(body.productId).toBe(testProductId);
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await getAuthed(`/api/transactions/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Transaction not found');
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/transactions/00000000-0000-4000-a000-000000000000');

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // PUT /api/transactions/:id
  // ============================================================

  describe('PUT /api/transactions/:id', () => {
    it('updates transaction name (200)', async () => {
      const createRes = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'expense',
        name: 'Old Name',
        amount: '30000.00',
        currency: 'COP',
        date: '2024-04-10',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as TransactionResponse;

      const res = await putJson(`/api/transactions/${created.id}`, {
        name: 'Updated Name',
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Updated Name');
      expect(body.amount).toBe('30000.00');
    });

    it('updates transaction amount and verifies balance recalculated', async () => {
      const productRes = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Update Balance Test',
        institution: 'Test',
        balance: '0',
        currency: 'COP',
      });

      expect(productRes.status).toBe(201);
      const product = (await productRes.json()) as ProductResponse;

      const createRes = await postJson(`/api/financial-products/${product.id}/transactions`, {
        type: 'income',
        name: 'Initial Income',
        amount: '1000.00',
        currency: 'COP',
        date: '2024-04-01',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as TransactionResponse;

      const updateRes = await putJson(`/api/transactions/${created.id}`, {
        amount: '2000.00',
      });

      expect(updateRes.status).toBe(200);
      const updated = (await updateRes.json()) as TransactionResponse;
      expect(updated.amount).toBe('2000.00');

      const balanceRes = await getAuthed(`/api/financial-products/${product.id}`);
      expect(balanceRes.status).toBe(200);
      const productAfter = (await balanceRes.json()) as ProductResponse;
      expect(productAfter.balance).toBe('2000.00');
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await putJson(`/api/transactions/${fakeId}`, {
        name: 'Ghost Transaction',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/transactions/00000000-0000-4000-a000-000000000000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Auth' }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // DELETE /api/transactions/:id
  // ============================================================

  describe('DELETE /api/transactions/:id', () => {
    it('deletes a transaction (200)', async () => {
      const createRes = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'expense',
        name: 'To Delete',
        amount: '10000.00',
        currency: 'COP',
        date: '2024-05-01',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as TransactionResponse;

      const res = await deleteAuthed(`/api/transactions/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as TransactionResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('To Delete');
    });

    it('verifies transaction no longer exists after delete', async () => {
      const createRes = await postJson(`/api/financial-products/${testProductId}/transactions`, {
        type: 'expense',
        name: 'Delete And Verify',
        amount: '20000.00',
        currency: 'COP',
        date: '2024-05-02',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as TransactionResponse;

      const deleteRes = await deleteAuthed(`/api/transactions/${created.id}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await getAuthed(`/api/transactions/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('verifies balance is recalculated after delete', async () => {
      const productRes = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Delete Balance Test',
        institution: 'Test',
        balance: '0',
        currency: 'COP',
      });

      expect(productRes.status).toBe(201);
      const product = (await productRes.json()) as ProductResponse;

      await postJson(`/api/financial-products/${product.id}/transactions`, {
        type: 'income',
        name: 'Income To Keep',
        amount: '5000.00',
        currency: 'COP',
        date: '2024-05-01',
      });

      const expenseRes = await postJson(`/api/financial-products/${product.id}/transactions`, {
        type: 'expense',
        name: 'Expense To Delete',
        amount: '2000.00',
        currency: 'COP',
        date: '2024-05-02',
      });

      expect(expenseRes.status).toBe(201);
      const expense = (await expenseRes.json()) as TransactionResponse;

      const balanceBefore = await getAuthed(`/api/financial-products/${product.id}`);
      const productBefore = (await balanceBefore.json()) as ProductResponse;
      expect(productBefore.balance).toBe('3000.00');

      await deleteAuthed(`/api/transactions/${expense.id}`);

      const balanceAfter = await getAuthed(`/api/financial-products/${product.id}`);
      const productAfter = (await balanceAfter.json()) as ProductResponse;
      expect(productAfter.balance).toBe('5000.00');
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await deleteAuthed(`/api/transactions/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================
  // Balance Recalculation
  // ============================================================

  describe('Balance Recalculation', () => {
    it('correctly recalculates balance across income, expense, and delete', async () => {
      const productRes = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Balance Recalc Test',
        institution: 'Test',
        balance: '0',
        currency: 'COP',
      });

      expect(productRes.status).toBe(201);
      const product = (await productRes.json()) as ProductResponse;

      await postJson(`/api/financial-products/${product.id}/transactions`, {
        type: 'income',
        name: 'Income',
        amount: '1000.00',
        currency: 'COP',
        date: '2024-06-01',
      });

      const afterIncome = await getAuthed(`/api/financial-products/${product.id}`);
      const productAfterIncome = (await afterIncome.json()) as ProductResponse;
      expect(productAfterIncome.balance).toBe('1000.00');

      const expenseRes = await postJson(`/api/financial-products/${product.id}/transactions`, {
        type: 'expense',
        name: 'Expense',
        amount: '300.00',
        currency: 'COP',
        date: '2024-06-02',
      });

      expect(expenseRes.status).toBe(201);
      const expense = (await expenseRes.json()) as TransactionResponse;

      const afterExpense = await getAuthed(`/api/financial-products/${product.id}`);
      const productAfterExpense = (await afterExpense.json()) as ProductResponse;
      expect(productAfterExpense.balance).toBe('700.00');

      await deleteAuthed(`/api/transactions/${expense.id}`);

      const afterDelete = await getAuthed(`/api/financial-products/${product.id}`);
      const productAfterDelete = (await afterDelete.json()) as ProductResponse;
      expect(productAfterDelete.balance).toBe('1000.00');
    });
  });
});
