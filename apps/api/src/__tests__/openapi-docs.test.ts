import { describe, expect, it } from 'vitest';
import { app } from '../app.js';

type OpenAPISpec = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, unknown>;
};

describe('OpenAPI documentation', () => {
  const request = (path: string) =>
    app.request(path, undefined, {
      ENVIRONMENT: '',
      DATABASE_URL: '',
      BETTER_AUTH_SECRET: '',
      BETTER_AUTH_URL: '',
    });

  describe('GET /openapi.json', () => {
    it('returns valid OpenAPI 3.1 spec', async () => {
      const res = await request('/openapi.json');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');

      const spec = (await res.json()) as OpenAPISpec;
      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info.title).toBe('Rumbo API');
      expect(spec.info.version).toBe('0.1.0');
    });

    it('includes registered routes in paths', async () => {
      const res = await request('/openapi.json');
      const spec = (await res.json()) as OpenAPISpec;
      expect(spec.paths).toHaveProperty('/health');
    });
  });

  describe('GET /reference', () => {
    it('returns HTML with Scalar UI', async () => {
      const res = await request('/reference');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');

      const html = await res.text();
      expect(html).toContain('scalar');
    });
  });
});
