import { describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../../../app.js';
import { getHealthStatus } from '../service.js';

vi.mock('../../../lib/db.js', () => ({
  createDb: vi.fn(),
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

describe('getHealthStatus', () => {
  it('returns ok when database is reachable', async () => {
    const { createDb } = await import('../../../lib/db.js');
    vi.mocked(createDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
    } as never);

    const result = await getHealthStatus(mockEnv);

    expect(result.status).toBe('ok');
    expect(result.environment).toBe('test');
    expect(result.database.status).toBe('ok');
    expect(result.database.latencyMs).toBeTypeOf('number');
  });

  it('returns degraded when database is unreachable', async () => {
    const { createDb } = await import('../../../lib/db.js');
    vi.mocked(createDb).mockRejectedValue(new Error('Connection refused'));

    const result = await getHealthStatus(mockEnv);

    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('error');
    expect(result.database.error).toBe('Connection refused');
  });

  it('returns a valid ISO timestamp', async () => {
    const { createDb } = await import('../../../lib/db.js');
    vi.mocked(createDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
    } as never);

    const result = await getHealthStatus(mockEnv);
    const parsed = new Date(result.timestamp);

    expect(parsed.toISOString()).toBe(result.timestamp);
  });
});
