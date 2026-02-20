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
}));

vi.mock('../../../lib/db.js', () => ({
  createDb: () => testDb,
}));

// -- Dynamic import AFTER mocks --
const { app } = await import('../../../app.js');

// -- Types --

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

type ProductListResponse = {
  products: ProductResponse[];
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

describe('Financial Products API', () => {
  let db: InstanceType<typeof Database>;
  let sessionCookie: string;

  // Helper functions
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
    // 1. Set up SQLite in-memory database
    db = new Database(':memory:');

    // Register PostgreSQL functions that Drizzle generates in queries.
    // SQLite does not have these natively, but Drizzle uses the PostgreSQL schema
    // definitions which emit gen_random_uuid() and now() in the generated SQL.
    db.function('gen_random_uuid', () => randomUUID());
    db.function('now', () => new Date().toISOString());

    // 2. Run Better Auth migrations for auth tables
    const config = {
      database: db,
      secret: 'test-secret-that-is-at-least-32-characters-long!!',
      baseURL: 'http://localhost:3000',
      emailAndPassword: { enabled: true },
    };

    const { runMigrations } = await getMigrations(config);
    await runMigrations();

    testAuth = betterAuth(config);

    // 3. Create financial_products table in SQLite
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

    // 4. Initialize Drizzle with SQLite
    testDb = drizzle(db, { schema });

    // 5. Sign up a test user to get session cookies
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
  });

  afterAll(() => {
    db.close();
  });

  // ============================================================
  // POST /api/financial-products
  // ============================================================

  describe('POST /api/financial-products', () => {
    it('creates a savings account (201)', async () => {
      const res = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Bancolombia Savings',
        institution: 'Bancolombia',
        balance: '1500000.50',
        currency: 'COP',
        metadata: { accountNumber: '1234', gmfExempt: true },
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as ProductResponse;
      expect(body.id).toBeDefined();
      expect(body.type).toBe('savings');
      expect(body.name).toBe('Bancolombia Savings');
      expect(body.institution).toBe('Bancolombia');
      expect(body.balance).toBe('1500000.50');
      expect(body.currency).toBe('COP');
      expect(body.metadata).toEqual({ accountNumber: '1234', gmfExempt: true });
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('creates a credit card with full metadata (201)', async () => {
      const res = await postJson('/api/financial-products', {
        type: 'credit_card',
        name: 'Nu Credit Card',
        institution: 'Nu Colombia',
        balance: '-250000.00',
        currency: 'COP',
        metadata: {
          last4Digits: '9876',
          creditLimit: '5000000.00',
          cutoffDay: 15,
          paymentDueDay: 5,
          network: 'mastercard',
        },
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as ProductResponse;
      expect(body.type).toBe('credit_card');
      expect(body.name).toBe('Nu Credit Card');
      expect(body.metadata).toEqual({
        last4Digits: '9876',
        creditLimit: '5000000.00',
        cutoffDay: 15,
        paymentDueDay: 5,
        network: 'mastercard',
      });
    });

    it('creates a cash product with minimal fields (201)', async () => {
      const res = await postJson('/api/financial-products', {
        type: 'cash',
        name: 'Cash',
        institution: 'Personal',
        balance: '100000.00',
        currency: 'COP',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as ProductResponse;
      expect(body.type).toBe('cash');
      expect(body.name).toBe('Cash');
      expect(body.metadata).toEqual({});
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/financial-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'savings',
          name: 'Test',
          institution: 'Test',
          balance: '0',
          currency: 'COP',
        }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 422 for invalid body (empty name)', async () => {
      const res = await postJson('/api/financial-products', {
        type: 'savings',
        name: '',
        institution: 'Bancolombia',
        balance: '0',
        currency: 'COP',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for invalid body (bad balance format)', async () => {
      const res = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Test Account',
        institution: 'Bancolombia',
        balance: 'not-a-number',
        currency: 'COP',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================
  // GET /api/financial-products
  // ============================================================

  describe('GET /api/financial-products', () => {
    it('returns list of products (200)', async () => {
      const res = await getAuthed('/api/financial-products');

      expect(res.status).toBe(200);
      const body = (await res.json()) as ProductListResponse;
      expect(Array.isArray(body.products)).toBe(true);
      // We created 3 products in the POST tests above
      expect(body.products.length).toBeGreaterThanOrEqual(3);
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/financial-products');

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // GET /api/financial-products/:id
  // ============================================================

  describe('GET /api/financial-products/:id', () => {
    it('returns a single product by ID (200)', async () => {
      // First, create a product to fetch
      const createRes = await postJson('/api/financial-products', {
        type: 'checking',
        name: 'Davivienda Checking',
        institution: 'Davivienda',
        balance: '500000.00',
        currency: 'COP',
        metadata: { accountNumber: '5678', gmfExempt: false },
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProductResponse;

      // Fetch it by ID
      const res = await getAuthed(`/api/financial-products/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as ProductResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Davivienda Checking');
      expect(body.type).toBe('checking');
      expect(body.balance).toBe('500000.00');
    });

    it('returns 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await getAuthed(`/api/financial-products/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Financial product not found');
    });
  });

  // ============================================================
  // PUT /api/financial-products/:id
  // ============================================================

  describe('PUT /api/financial-products/:id', () => {
    it('updates product name and balance (200)', async () => {
      // Create a product to update
      const createRes = await postJson('/api/financial-products', {
        type: 'savings',
        name: 'Old Name',
        institution: 'BBVA',
        balance: '100000.00',
        currency: 'COP',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProductResponse;

      // Update it
      const res = await putJson(`/api/financial-products/${created.id}`, {
        name: 'Updated Name',
        balance: '200000.00',
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ProductResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Updated Name');
      expect(body.balance).toBe('200000.00');
      // institution should remain the same
      expect(body.institution).toBe('BBVA');
    });

    it('returns 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await putJson(`/api/financial-products/${fakeId}`, {
        name: 'Ghost Product',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================
  // DELETE /api/financial-products/:id
  // ============================================================

  describe('DELETE /api/financial-products/:id', () => {
    it('deletes a product and returns it (200)', async () => {
      // Create a product to delete
      const createRes = await postJson('/api/financial-products', {
        type: 'cash',
        name: 'To Delete',
        institution: 'Personal',
        balance: '50000.00',
        currency: 'COP',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProductResponse;

      // Delete it
      const res = await deleteAuthed(`/api/financial-products/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as ProductResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('To Delete');
    });

    it('verifies product no longer exists after delete', async () => {
      // Create and delete a product
      const createRes = await postJson('/api/financial-products', {
        type: 'cash',
        name: 'Delete And Verify',
        institution: 'Personal',
        balance: '10000.00',
        currency: 'COP',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProductResponse;

      // Delete it
      const deleteRes = await deleteAuthed(`/api/financial-products/${created.id}`);
      expect(deleteRes.status).toBe(200);

      // Try to fetch the deleted product
      const getRes = await getAuthed(`/api/financial-products/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await deleteAuthed(`/api/financial-products/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
