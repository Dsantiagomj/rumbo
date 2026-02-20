import { describe, expect, it } from 'vitest';
import { app } from '../../../app.js';
import { healthResponseSchema } from '../validation.js';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('response matches the OpenAPI schema', async () => {
    const res = await app.request('/health');
    const body = await res.json();
    const result = healthResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});
