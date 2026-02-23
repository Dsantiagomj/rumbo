import { describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../../../app.js';
import { app } from '../../../app.js';
import { healthResponseSchema } from '../validation.js';

vi.mock('../../../lib/db.js', () => ({
  createDb: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
}));

const mockEnv: Bindings = {
  ENVIRONMENT: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  BETTER_AUTH_SECRET: 'test-secret',
  BETTER_AUTH_URL: 'http://localhost:8787',
  APP_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  RESEND_API_KEY: 'test',
  EMAIL_FROM: 'test@test.com',
};

describe('GET /health', () => {
  it('returns 200 with health status', async () => {
    const res = await app.request('/health', {}, mockEnv);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.database).toBeDefined();
  });

  it('response matches the OpenAPI schema', async () => {
    const res = await app.request('/health', {}, mockEnv);
    const body = await res.json();
    const result = healthResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it('includes X-Request-Id header', async () => {
    const res = await app.request('/health', {}, mockEnv);
    const requestId = res.headers.get('X-Request-Id');
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
