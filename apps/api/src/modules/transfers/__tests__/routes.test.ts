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

// Mock the TRM service to avoid external API calls in tests
vi.mock('../../trm/service.js', () => ({
  getCurrentTRM: vi.fn().mockResolvedValue({ rate: 4100.5, date: '2026-03-01' }),
  TRMUnavailableError: class TRMUnavailableError extends Error {
    constructor() {
      super('TRM rate is currently unavailable');
      this.name = 'TRMUnavailableError';
    }
  },
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

type TransferResponse = {
  transferId: string;
  sourceTransaction: TransactionResponse;
  destinationTransaction: TransactionResponse;
  exchangeRate: string | null;
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

type ErrorBody = {
  error: {
    message: string;
    code: string;
    status: number;
    details?: { path: (string | number)[]; message: string }[];
  };
};

// -- Test setup --

describe('Transfers API', () => {
  let db: InstanceType<typeof Database>;
  let sessionCookie: string;
  let copProductId: string;
  let copProduct2Id: string;

  const postJson = (path: string, body: Record<string, unknown>) =>
    app.request(path, {
      method: 'POST',
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
    // biome-ignore lint/suspicious/noExplicitAny: patching better-sqlite3 internals for PG->SQLite type compat
    (db as any).prepare = (sql: string) => {
      const adjustedSql = sql.replace(/\bILIKE\b/gi, 'LIKE');
      const stmt = origPrepare(adjustedSql);
      const patchValue = (a: unknown): unknown => {
        if (typeof a === 'boolean') return a ? 1 : 0;
        if (a instanceof Date) return a.toISOString();
        if (Array.isArray(a)) return a.map(patchValue);
        if (a !== null && typeof a === 'object') return JSON.stringify(a);
        return a;
      };
      const patchFn =
        (fn: (...args: unknown[]) => unknown) =>
        (...args: unknown[]) =>
          fn(...args.map(patchValue));
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

    // biome-ignore lint/suspicious/noExplicitAny: patching drizzle internals for SQLite test compat
    (testDb as any).transaction = async (fn: (tx: typeof testDb) => Promise<any>) => fn(testDb);

    // Sign up test user
    const signUpRes = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Transfer Test User',
        email: 'transfer-test@example.com',
        password: 'securepassword123',
      }),
    });

    const setCookies = signUpRes.headers.getSetCookie();
    sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    // Create source COP product (Bancolombia)
    const copRes = await postJson('/api/financial-products', {
      type: 'savings',
      name: 'Bancolombia Ahorros',
      institution: 'Bancolombia',
      balance: '0',
      currency: 'COP',
    });
    expect(copRes.status).toBe(201);
    const copProduct = (await copRes.json()) as ProductResponse;
    copProductId = copProduct.id;

    // Seed initial income so source has balance for transfers
    await postJson(`/api/financial-products/${copProductId}/transactions`, {
      type: 'income',
      name: 'Salary',
      amount: '10000000.00',
      currency: 'COP',
      date: '2026-02-01',
    });

    // Create destination COP product (Nequi)
    const cop2Res = await postJson('/api/financial-products', {
      type: 'savings',
      name: 'Nequi',
      institution: 'Nequi',
      balance: '0',
      currency: 'COP',
    });
    expect(cop2Res.status).toBe(201);
    const cop2Product = (await cop2Res.json()) as ProductResponse;
    copProduct2Id = cop2Product.id;
  });

  afterAll(() => {
    db.close();
  });

  // ============================================================
  // POST /api/transfers - Same-currency transfer
  // ============================================================

  describe('POST /api/transfers (same currency)', () => {
    it('creates two linked transactions for same-currency transfer (201)', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '500000.00',
        currency: 'COP',
        date: '2026-03-01',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransferResponse;

      // Both transactions share the same transferId
      expect(body.transferId).toBeDefined();
      expect(body.sourceTransaction.transferId).toBe(body.transferId);
      expect(body.destinationTransaction.transferId).toBe(body.transferId);

      // Source is expense, destination is income
      expect(body.sourceTransaction.type).toBe('expense');
      expect(body.destinationTransaction.type).toBe('income');

      // Both have excluded=true, categoryId=null
      expect(body.sourceTransaction.excluded).toBe(true);
      expect(body.destinationTransaction.excluded).toBe(true);
      expect(body.sourceTransaction.categoryId).toBeNull();
      expect(body.destinationTransaction.categoryId).toBeNull();

      // Same amounts for same-currency
      expect(body.sourceTransaction.amount).toBe('500000.00');
      expect(body.destinationTransaction.amount).toBe('500000.00');

      // No exchange rate for same currency
      expect(body.exchangeRate).toBeNull();
    });

    it('auto-generates correct names', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '100000.00',
        currency: 'COP',
        date: '2026-03-02',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransferResponse;

      expect(body.sourceTransaction.name).toBe('Transferencia a Nequi');
      expect(body.destinationTransaction.name).toBe('Transferencia de Bancolombia Ahorros');
    });

    it('includes notes on both legs when provided', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '50000.00',
        currency: 'COP',
        date: '2026-03-03',
        notes: 'Monthly rent',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransferResponse;
      expect(body.sourceTransaction.notes).toBe('Monthly rent');
      expect(body.destinationTransaction.notes).toBe('Monthly rent');
    });

    it('assigns correct productIds to each leg', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '25000.00',
        currency: 'COP',
        date: '2026-03-04',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as TransferResponse;
      expect(body.sourceTransaction.productId).toBe(copProductId);
      expect(body.destinationTransaction.productId).toBe(copProduct2Id);
    });
  });

  // ============================================================
  // POST /api/transfers - Error cases
  // ============================================================

  describe('POST /api/transfers (error cases)', () => {
    it('returns 404 when source product not found', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await postJson('/api/transfers', {
        sourceProductId: fakeId,
        destinationProductId: copProduct2Id,
        amount: '100000.00',
        currency: 'COP',
        date: '2026-03-01',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Financial product not found');
    });

    it('returns 404 when destination product not found', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: fakeId,
        amount: '100000.00',
        currency: 'COP',
        date: '2026-03-01',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 when source equals destination', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProductId,
        amount: '100000.00',
        currency: 'COP',
        date: '2026-03-01',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details?.[0]?.message).toBe('Source and destination must be different');
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProductId: copProductId,
          destinationProductId: copProduct2Id,
          amount: '100000.00',
          currency: 'COP',
          date: '2026-03-01',
        }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 422 for invalid amount format', async () => {
      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: 'abc',
        currency: 'COP',
        date: '2026-03-01',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================
  // POST /api/transfers - Balance recalculation
  // ============================================================

  describe('POST /api/transfers (balance recalculation)', () => {
    it('recalculates balances on both source and destination products', async () => {
      const srcBefore = await getAuthed(`/api/financial-products/${copProductId}`);
      const srcProductBefore = (await srcBefore.json()) as ProductResponse;
      const srcBalanceBefore = Number.parseFloat(srcProductBefore.balance);

      const dstBefore = await getAuthed(`/api/financial-products/${copProduct2Id}`);
      const dstProductBefore = (await dstBefore.json()) as ProductResponse;
      const dstBalanceBefore = Number.parseFloat(dstProductBefore.balance);

      const transferAmount = 200000;

      const res = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: `${transferAmount}.00`,
        currency: 'COP',
        date: '2026-03-05',
      });

      expect(res.status).toBe(201);

      const srcAfter = await getAuthed(`/api/financial-products/${copProductId}`);
      const srcProductAfter = (await srcAfter.json()) as ProductResponse;
      expect(Number.parseFloat(srcProductAfter.balance)).toBe(srcBalanceBefore - transferAmount);

      const dstAfter = await getAuthed(`/api/financial-products/${copProduct2Id}`);
      const dstProductAfter = (await dstAfter.json()) as ProductResponse;
      expect(Number.parseFloat(dstProductAfter.balance)).toBe(dstBalanceBefore + transferAmount);
    });
  });

  // ============================================================
  // DELETE - Transfer cascade deletion
  // ============================================================

  describe('DELETE transfer cascade', () => {
    it('deleteTransaction cascades to paired transfer leg', async () => {
      const createRes = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '75000.00',
        currency: 'COP',
        date: '2026-03-10',
      });

      expect(createRes.status).toBe(201);
      const transfer = (await createRes.json()) as TransferResponse;

      // Delete only the source leg
      const deleteRes = await deleteAuthed(`/api/transactions/${transfer.sourceTransaction.id}`);
      expect(deleteRes.status).toBe(200);

      // Verify source leg is gone
      const srcGet = await getAuthed(`/api/transactions/${transfer.sourceTransaction.id}`);
      expect(srcGet.status).toBe(404);

      // Verify destination leg is also gone (cascade)
      const dstGet = await getAuthed(`/api/transactions/${transfer.destinationTransaction.id}`);
      expect(dstGet.status).toBe(404);
    });

    it('deleting destination leg also cascades to source leg', async () => {
      const createRes = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '60000.00',
        currency: 'COP',
        date: '2026-03-11',
      });

      expect(createRes.status).toBe(201);
      const transfer = (await createRes.json()) as TransferResponse;

      // Delete the destination leg this time
      const deleteRes = await deleteAuthed(
        `/api/transactions/${transfer.destinationTransaction.id}`,
      );
      expect(deleteRes.status).toBe(200);

      // Both legs should be deleted
      const srcGet = await getAuthed(`/api/transactions/${transfer.sourceTransaction.id}`);
      expect(srcGet.status).toBe(404);

      const dstGet = await getAuthed(`/api/transactions/${transfer.destinationTransaction.id}`);
      expect(dstGet.status).toBe(404);
    });

    it('cascade deletion recalculates balances on both products', async () => {
      const srcBefore = await getAuthed(`/api/financial-products/${copProductId}`);
      const srcBalanceBefore = Number.parseFloat(
        ((await srcBefore.json()) as ProductResponse).balance,
      );

      const dstBefore = await getAuthed(`/api/financial-products/${copProduct2Id}`);
      const dstBalanceBefore = Number.parseFloat(
        ((await dstBefore.json()) as ProductResponse).balance,
      );

      const createRes = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '150000.00',
        currency: 'COP',
        date: '2026-03-12',
      });

      expect(createRes.status).toBe(201);
      const transfer = (await createRes.json()) as TransferResponse;

      // Delete the transfer via one leg
      await deleteAuthed(`/api/transactions/${transfer.sourceTransaction.id}`);

      // Balances should return to pre-transfer values
      const srcAfter = await getAuthed(`/api/financial-products/${copProductId}`);
      const srcBalanceAfter = Number.parseFloat(
        ((await srcAfter.json()) as ProductResponse).balance,
      );

      const dstAfter = await getAuthed(`/api/financial-products/${copProduct2Id}`);
      const dstBalanceAfter = Number.parseFloat(
        ((await dstAfter.json()) as ProductResponse).balance,
      );

      expect(srcBalanceAfter).toBe(srcBalanceBefore);
      expect(dstBalanceAfter).toBe(dstBalanceBefore);
    });
  });

  // ============================================================
  // Bulk delete - Transfer counterparts included
  // ============================================================

  describe('DELETE /api/transactions/bulk (transfer counterparts)', () => {
    it('bulkDeleteTransactions includes transfer counterparts', async () => {
      const createRes = await postJson('/api/transfers', {
        sourceProductId: copProductId,
        destinationProductId: copProduct2Id,
        amount: '80000.00',
        currency: 'COP',
        date: '2026-03-15',
      });

      expect(createRes.status).toBe(201);
      const transfer = (await createRes.json()) as TransferResponse;

      // Bulk delete with only the source transaction ID
      const bulkRes = await app.request('/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ ids: [transfer.sourceTransaction.id] }),
      });

      expect(bulkRes.status).toBe(200);
      const bulkBody = (await bulkRes.json()) as { deleted: number; failed: unknown[] };

      // Both should be deleted (the requested one + the counterpart)
      expect(bulkBody.deleted).toBe(2);
      expect(bulkBody.failed).toHaveLength(0);

      // Verify both are gone
      const srcGet = await getAuthed(`/api/transactions/${transfer.sourceTransaction.id}`);
      expect(srcGet.status).toBe(404);

      const dstGet = await getAuthed(`/api/transactions/${transfer.destinationTransaction.id}`);
      expect(dstGet.status).toBe(404);
    });
  });
});
