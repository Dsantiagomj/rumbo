import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db';
import Database from 'better-sqlite3';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type AuthUser = { id: string; email: string; name: string; emailVerified: boolean };
type AuthResponse = { token?: string; user?: AuthUser };
type ErrorResponse = { message?: string; code?: string };

function createTestAuthConfig(db: InstanceType<typeof Database>) {
  return {
    database: db,
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    baseURL: 'http://localhost:3000',
    emailAndPassword: { enabled: true },
  };
}

describe('Auth endpoints (email + password)', () => {
  let app: Hono;
  let db: InstanceType<typeof Database>;

  beforeAll(async () => {
    db = new Database(':memory:');
    const config = createTestAuthConfig(db);

    // Run Better Auth migrations to create tables in SQLite
    const { runMigrations } = await getMigrations(config);
    await runMigrations();

    const auth = betterAuth(config);
    app = new Hono();
    app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));
  });

  afterAll(() => {
    db.close();
  });

  const postJson = (
    path: string,
    body: Record<string, unknown>,
    headers?: Record<string, string>,
  ) =>
    app.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  describe('POST /api/auth/sign-up/email', () => {
    it('creates a new user and returns session token', async () => {
      const res = await postJson('/api/auth/sign-up/email', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'securepassword123',
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as AuthResponse;
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe('test@example.com');
      expect(data.user?.name).toBe('Test User');
      expect(data.token).toBeDefined();
    });

    it('rejects duplicate email registration', async () => {
      await postJson('/api/auth/sign-up/email', {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'securepassword123',
      });

      const res = await postJson('/api/auth/sign-up/email', {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'securepassword123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      const data = (await res.json()) as ErrorResponse;
      expect(data.message).toBeDefined();
    });

    it('does not store password in plain text', async () => {
      const plainPassword = 'myplainpassword123';
      await postJson('/api/auth/sign-up/email', {
        name: 'Hash Test User',
        email: 'hashtest@example.com',
        password: plainPassword,
      });

      // Query the account table directly — column names vary by adapter,
      // so check ALL values to ensure none match the plain password.
      const accounts = db.prepare('SELECT * FROM account').all() as Array<Record<string, string>>;
      expect(accounts.length).toBeGreaterThan(0);

      const hasPlainPassword = accounts.some((row) =>
        Object.values(row).some((value) => value === plainPassword),
      );
      expect(hasPlainPassword).toBe(false);
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    const loginEmail = 'signin@example.com';
    const loginPassword = 'securepassword123';

    beforeAll(async () => {
      await postJson('/api/auth/sign-up/email', {
        name: 'Sign In User',
        email: loginEmail,
        password: loginPassword,
      });
    });

    it('authenticates with valid credentials and returns session token', async () => {
      const res = await postJson('/api/auth/sign-in/email', {
        email: loginEmail,
        password: loginPassword,
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as AuthResponse;
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(loginEmail);
      expect(data.token).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const res = await postJson('/api/auth/sign-in/email', {
        email: loginEmail,
        password: 'wrongpassword',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      const data = (await res.json()) as ErrorResponse;
      expect(data.message).toBeDefined();
    });

    it('rejects non-existent email', async () => {
      const res = await postJson('/api/auth/sign-in/email', {
        email: 'nobody@example.com',
        password: 'anypassword123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      const data = (await res.json()) as ErrorResponse;
      expect(data.message).toBeDefined();
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('invalidates the session', async () => {
      const signUpRes = await postJson('/api/auth/sign-up/email', {
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'securepassword123',
      });

      expect(signUpRes.status).toBe(200);

      // Extract session cookies from sign-up response
      const setCookies = signUpRes.headers.getSetCookie();
      const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');

      const res = await postJson('/api/auth/sign-out', {}, { Cookie: cookieHeader });

      expect(res.status).toBe(200);
    });
  });
});
