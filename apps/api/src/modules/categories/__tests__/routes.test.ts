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

type CategoryResponse = {
  id: string;
  userId: string | null;
  name: string;
  parentId: string | null;
  isDefault: boolean;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
};

type CategoryListResponse = {
  categories: CategoryResponse[];
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

const DEFAULT_CATEGORY_ID = '11111111-1111-4111-a111-111111111111';

describe('Categories API', () => {
  let db: InstanceType<typeof Database>;
  let sessionCookie: string;
  let testUserId: string;

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
    db.function('gen_random_uuid', () => randomUUID());
    db.function('now', () => new Date().toISOString());

    // Patch better-sqlite3 to convert boolean bind params to integers.
    // Drizzle's PG schema boolean() columns bind JS booleans, but SQLite
    // only accepts numbers/strings/bigints/buffers/null.
    const origPrepare = db.prepare.bind(db);
    // biome-ignore lint/suspicious/noExplicitAny: patching better-sqlite3 internals for boolean→int conversion
    (db as any).prepare = (sql: string) => {
      const stmt = origPrepare(sql);
      const patchFn =
        (fn: (...args: unknown[]) => unknown) =>
        (...args: unknown[]) =>
          fn(...args.map((a) => (typeof a === 'boolean' ? (a ? 1 : 0) : a)));
      stmt.run = patchFn(stmt.run.bind(stmt)) as typeof stmt.run;
      stmt.get = patchFn(stmt.get.bind(stmt)) as typeof stmt.get;
      stmt.all = patchFn(stmt.all.bind(stmt)) as typeof stmt.all;
      return stmt;
    };

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

    // 3. Create categories table in SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        user_id TEXT,
        name TEXT NOT NULL,
        parent_id TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // 3b. Create financial_products table for user-scoped transaction counts
    db.exec(`
      CREATE TABLE IF NOT EXISTS financial_products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        institution TEXT NOT NULL,
        balance TEXT NOT NULL DEFAULT '0',
        currency TEXT NOT NULL DEFAULT 'COP',
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // 3c. Create transactions table for LEFT JOIN in listCategories
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
        currency TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 4. Insert a default category (userId = NULL, isDefault = 1)
    db.exec(
      "INSERT INTO categories (id, user_id, name, parent_id, is_default) VALUES ('11111111-1111-4111-a111-111111111111', NULL, 'Alimentacion', NULL, 1)",
    );

    // 5. Initialize Drizzle with SQLite
    testDb = drizzle(db, { schema });

    // 6. Sign up a test user to get session cookies
    const signUpRes = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'securepassword123',
      }),
    });

    const userRecord = db.prepare("SELECT id FROM user WHERE email = 'test@example.com'").get() as
      | { id: string }
      | undefined;

    if (!userRecord) {
      throw new Error('Failed to load test user');
    }

    testUserId = userRecord.id;

    const setCookies = signUpRes.headers.getSetCookie();
    sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  });

  afterAll(() => {
    db.close();
  });

  // ============================================================
  // POST /api/categories
  // ============================================================

  describe('POST /api/categories', () => {
    it('creates a category successfully (201)', async () => {
      const res = await postJson('/api/categories', {
        name: 'Transporte',
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as CategoryResponse;
      expect(body.id).toBeDefined();
      expect(body.userId).toBeDefined();
      expect(body.name).toBe('Transporte');
      expect(body.parentId).toBeNull();
      expect(body.isDefault).toBe(false);
      expect(body.transactionCount).toBe(0);
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('creates a subcategory with parentId (201)', async () => {
      // First, create a parent category
      const parentRes = await postJson('/api/categories', {
        name: 'Entretenimiento',
      });

      expect(parentRes.status).toBe(201);
      const parent = (await parentRes.json()) as CategoryResponse;

      // Create a subcategory referencing the parent
      const res = await postJson('/api/categories', {
        name: 'Cine',
        parentId: parent.id,
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as CategoryResponse;
      expect(body.name).toBe('Cine');
      expect(body.parentId).toBe(parent.id);
      expect(body.isDefault).toBe(false);
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
        }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 422 for invalid body (empty name)', async () => {
      const res = await postJson('/api/categories', {
        name: '',
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================
  // GET /api/categories
  // ============================================================

  describe('GET /api/categories', () => {
    it('returns list of categories including defaults (200)', async () => {
      const res = await getAuthed('/api/categories');

      expect(res.status).toBe(200);
      const body = (await res.json()) as CategoryListResponse;
      expect(Array.isArray(body.categories)).toBe(true);
      // Should include default category + user-created categories from POST tests
      expect(body.categories.length).toBeGreaterThanOrEqual(3);

      // Verify the default category is present in the list
      const defaultCategory = body.categories.find((c) => c.id === DEFAULT_CATEGORY_ID);
      expect(defaultCategory).toBeDefined();
      expect(defaultCategory?.name).toBe('Alimentacion');
      expect(defaultCategory?.isDefault).toBe(true);
      expect(defaultCategory?.userId).toBeNull();
    });

    it('counts only current user transactions for default categories (200)', async () => {
      const currentProductId = randomUUID();
      const otherProductId = randomUUID();

      db.prepare(
        'INSERT INTO financial_products (id, user_id, type, name, institution, balance, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(currentProductId, testUserId, 'cash', 'Wallet', 'Rumbo', '100.00', 'COP');

      const otherSignUpRes = await app.request('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Other User',
          email: 'other@example.com',
          password: 'securepassword123',
        }),
      });

      expect(otherSignUpRes.status).toBe(200);

      const otherUserRecord = db
        .prepare("SELECT id FROM user WHERE email = 'other@example.com'")
        .get() as { id: string } | undefined;

      expect(otherUserRecord).toBeDefined();
      const otherUserId = otherUserRecord?.id;

      if (!otherUserId) {
        throw new Error('Failed to load second test user');
      }

      db.prepare(
        'INSERT INTO financial_products (id, user_id, type, name, institution, balance, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(otherProductId, otherUserId, 'cash', 'Wallet Other', 'Rumbo', '100.00', 'COP');

      db.prepare(
        'INSERT INTO transactions (id, product_id, category_id, type, name, amount, currency, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        randomUUID(),
        currentProductId,
        DEFAULT_CATEGORY_ID,
        'expense',
        'Current user tx',
        '10.00',
        'COP',
        '2026-02-26',
      );

      db.prepare(
        'INSERT INTO transactions (id, product_id, category_id, type, name, amount, currency, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        randomUUID(),
        otherProductId,
        DEFAULT_CATEGORY_ID,
        'expense',
        'Other user tx',
        '20.00',
        'COP',
        '2026-02-26',
      );

      const res = await getAuthed('/api/categories');

      expect(res.status).toBe(200);
      const body = (await res.json()) as CategoryListResponse;
      const defaultCategory = body.categories.find(
        (category) => category.id === DEFAULT_CATEGORY_ID,
      );

      expect(defaultCategory).toBeDefined();
      expect(defaultCategory?.transactionCount).toBe(1);
    });

    it('returns 401 without authentication', async () => {
      const res = await app.request('/api/categories');

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // GET /api/categories/:id
  // ============================================================

  describe('GET /api/categories/:id', () => {
    it('returns a single category by ID (200)', async () => {
      // Create a category to fetch
      const createRes = await postJson('/api/categories', {
        name: 'Salud',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CategoryResponse;

      // Fetch it by ID
      const res = await getAuthed(`/api/categories/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as CategoryResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Salud');
      expect(body.isDefault).toBe(false);
    });

    it('returns transactionCount for user category by ID (200)', async () => {
      const createRes = await postJson('/api/categories', {
        name: 'Hogar',
      });

      expect(createRes.status).toBe(201);
      const createdCategory = (await createRes.json()) as CategoryResponse;

      const productId = randomUUID();
      db.prepare(
        'INSERT INTO financial_products (id, user_id, type, name, institution, balance, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(productId, testUserId, 'cash', 'Daily Wallet', 'Rumbo', '150.00', 'COP');

      db.prepare(
        'INSERT INTO transactions (id, product_id, category_id, type, name, amount, currency, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        randomUUID(),
        productId,
        createdCategory.id,
        'expense',
        'Soap',
        '12.00',
        'COP',
        '2026-02-26',
      );

      const getRes = await getAuthed(`/api/categories/${createdCategory.id}`);

      expect(getRes.status).toBe(200);
      const body = (await getRes.json()) as CategoryResponse;
      expect(body.transactionCount).toBe(1);
    });

    it('returns 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await getAuthed(`/api/categories/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Category not found');
    });
  });

  // ============================================================
  // PUT /api/categories/:id
  // ============================================================

  describe('PUT /api/categories/:id', () => {
    it('updates category name (200)', async () => {
      // Create a category to update
      const createRes = await postJson('/api/categories', {
        name: 'Viejo Nombre',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CategoryResponse;

      // Update it
      const res = await putJson(`/api/categories/${created.id}`, {
        name: 'Nuevo Nombre',
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as CategoryResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Nuevo Nombre');
    });

    it('returns 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await putJson(`/api/categories/${fakeId}`, {
        name: 'Ghost Category',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 when updating a default category (userId is null)', async () => {
      const res = await putJson(`/api/categories/${DEFAULT_CATEGORY_ID}`, {
        name: 'Trying to rename default',
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================
  // DELETE /api/categories/:id
  // ============================================================

  describe('DELETE /api/categories/:id', () => {
    it('deletes a user-created category (200)', async () => {
      // Create a category to delete
      const createRes = await postJson('/api/categories', {
        name: 'Para Borrar',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CategoryResponse;

      // Delete it
      const res = await deleteAuthed(`/api/categories/${created.id}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as CategoryResponse;
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Para Borrar');
    });

    it('verifies category no longer exists after delete', async () => {
      // Create and delete a category
      const createRes = await postJson('/api/categories', {
        name: 'Borrar Y Verificar',
      });

      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CategoryResponse;

      // Delete it
      const deleteRes = await deleteAuthed(`/api/categories/${created.id}`);
      expect(deleteRes.status).toBe(200);

      // Try to fetch the deleted category
      const getRes = await getAuthed(`/api/categories/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const res = await deleteAuthed(`/api/categories/${fakeId}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 when deleting a default category (userId is null)', async () => {
      const res = await deleteAuthed(`/api/categories/${DEFAULT_CATEGORY_ID}`);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorBody;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
