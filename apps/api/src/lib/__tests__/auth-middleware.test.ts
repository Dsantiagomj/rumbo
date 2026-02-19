import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db';
import Database from 'better-sqlite3';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AppEnv, AuthUser } from '../../app.js';

let testAuth: ReturnType<typeof betterAuth>;

vi.mock('../auth.js', () => ({
  getAuth: () => testAuth,
}));

// Import after mock so the mock is in place
const { authMiddleware } = await import('../auth-middleware.js');

type ErrorBody = { error: { message: string; code: string; status: number } };

describe('authMiddleware', () => {
  let app: Hono<AppEnv>;
  let db: InstanceType<typeof Database>;
  let sessionCookie: string;

  beforeAll(async () => {
    db = new Database(':memory:');
    const config = {
      database: db,
      secret: 'test-secret-that-is-at-least-32-characters-long!!',
      baseURL: 'http://localhost:3000',
      emailAndPassword: { enabled: true },
    };

    const { runMigrations } = await getMigrations(config);
    await runMigrations();

    testAuth = betterAuth(config);

    app = new Hono<AppEnv>();

    // Auth routes must be registered before any request
    app.on(['POST', 'GET'], '/api/auth/**', (c) => testAuth.handler(c.req.raw));

    // Public route — no auth required
    app.get('/public', (c) => c.json({ message: 'public' }));

    // Protected routes — auth required
    app.use('/protected/*', authMiddleware);
    app.get('/protected/me', (c) => {
      const user = c.get('user');
      return c.json({ id: user.id, email: user.email, name: user.name });
    });

    // Sign up a user and capture session cookie
    const signUpRes = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Middleware User',
        email: 'middleware@example.com',
        password: 'securepassword123',
      }),
    });

    // Better Auth sets session cookies in the response
    const setCookies = signUpRes.headers.getSetCookie();
    sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  });

  afterAll(() => {
    db.close();
  });

  it('allows access to public routes without authentication', async () => {
    const res = await app.request('/public');

    expect(res.status).toBe(200);
    const data = (await res.json()) as { message: string };
    expect(data.message).toBe('public');
  });

  it('returns 401 for protected routes without session', async () => {
    const res = await app.request('/protected/me');

    expect(res.status).toBe(401);
    const data = (await res.json()) as ErrorBody;
    expect(data.error.code).toBe('UNAUTHORIZED');
    expect(data.error.message).toBe('Unauthorized');
  });

  it('returns 401 for protected routes with invalid cookie', async () => {
    const res = await app.request('/protected/me', {
      headers: { Cookie: 'better-auth.session_token=invalid-token-value' },
    });

    expect(res.status).toBe(401);
    const data = (await res.json()) as ErrorBody;
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('allows access to protected routes with valid session', async () => {
    const res = await app.request('/protected/me', {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; email: string; name: string };
    expect(data.email).toBe('middleware@example.com');
    expect(data.name).toBe('Middleware User');
    expect(data.id).toBeDefined();
  });

  it('sets user in context with correct shape', async () => {
    const res = await app.request('/protected/me', {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as AuthUser;
    expect(typeof data.id).toBe('string');
    expect(typeof data.email).toBe('string');
    expect(typeof data.name).toBe('string');
  });
});
