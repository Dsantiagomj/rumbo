import { describe, expect, it } from 'vitest';
import { getHealthStatus } from '../service.js';

describe('getHealthStatus', () => {
  it('returns status ok', () => {
    const result = getHealthStatus();
    expect(result.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', () => {
    const result = getHealthStatus();
    const parsed = new Date(result.timestamp);
    expect(parsed.toISOString()).toBe(result.timestamp);
  });
});
