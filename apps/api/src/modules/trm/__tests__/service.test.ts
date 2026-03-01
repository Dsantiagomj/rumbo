import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to control module-level cache state, so we use vi.resetModules()
// and dynamic imports to get fresh instances of the TRM service per test group.

describe('getCurrentTRM', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns rate and date from datos.gov.co API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue([{ valor: '4100.50', vigenciadesde: '2026-03-01T00:00:00.000' }]),
    });

    const { getCurrentTRM } = await import('../service.js');
    const result = await getCurrentTRM();

    expect(result).toEqual({ rate: 4100.5, date: '2026-03-01' });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('datos.gov.co'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns cached value when within TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue([{ valor: '4200.00', vigenciadesde: '2026-03-01T00:00:00.000' }]),
    });
    globalThis.fetch = fetchMock;

    const { getCurrentTRM } = await import('../service.js');

    // First call primes the cache
    const first = await getCurrentTRM();
    expect(first).toEqual({ rate: 4200, date: '2026-03-01' });
    expect(fetchMock).toHaveBeenCalledOnce();

    // Second call should use cache
    const second = await getCurrentTRM();
    expect(second).toEqual({ rate: 4200, date: '2026-03-01' });
    expect(fetchMock).toHaveBeenCalledOnce(); // Still called only once
  });

  it('returns stale cache when API fails', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call succeeds (primes cache)
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([{ valor: '4300.75', vigenciadesde: '2026-02-28T00:00:00.000' }]),
        });
      }
      // Subsequent calls fail
      return Promise.reject(new Error('Network error'));
    });

    const { getCurrentTRM } = await import('../service.js');

    // Prime the cache
    const first = await getCurrentTRM();
    expect(first).toEqual({ rate: 4300.75, date: '2026-02-28' });

    // Force cache expiry by manipulating the module's cached state
    // Since we can't directly access module-level `cachedTRM`, we advance
    // time past the TTL (1 hour = 3_600_000 ms)
    vi.useFakeTimers();
    vi.advanceTimersByTime(3_600_001);

    // Now the cache is stale, API fails, should return stale cache
    const second = await getCurrentTRM();
    expect(second).toEqual({ rate: 4300.75, date: '2026-02-28' });

    vi.useRealTimers();
  });

  it('throws TRMUnavailableError when no cache and API fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Fresh module import (no cache from previous tests)
    const { getCurrentTRM, TRMUnavailableError } = await import('../service.js');

    await expect(getCurrentTRM()).rejects.toThrow(TRMUnavailableError);
    await expect(getCurrentTRM()).rejects.toThrow('TRM rate is currently unavailable');
  });

  it('throws TRMUnavailableError when API returns non-ok status and no cache', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { getCurrentTRM, TRMUnavailableError } = await import('../service.js');

    await expect(getCurrentTRM()).rejects.toThrow(TRMUnavailableError);
  });

  it('throws TRMUnavailableError when API returns empty array and no cache', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    const { getCurrentTRM, TRMUnavailableError } = await import('../service.js');

    await expect(getCurrentTRM()).rejects.toThrow(TRMUnavailableError);
  });
});
