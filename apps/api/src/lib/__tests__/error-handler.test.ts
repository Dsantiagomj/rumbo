import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';
import { onError, onNotFound } from '../error-handler.js';

type ErrorBody = {
  error: {
    message: string;
    code: string;
    status: number;
    stack?: string;
    details?: Array<{ path: (string | number)[]; message: string }>;
  };
};

function createTestApp(env: Record<string, string> = {}) {
  const app = new OpenAPIHono<{ Bindings: { ENVIRONMENT: string } }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              status: 422,
              details: result.error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
              })),
            },
          },
          422,
        );
      }
    },
  });

  app.onError(onError);
  app.notFound(onNotFound);

  // Route that throws an HTTPException
  app.get('/http-error', () => {
    throw new HTTPException(403, { message: 'Access denied' });
  });

  // Route that throws an unhandled error
  app.get('/unhandled', () => {
    throw new Error('Something broke');
  });

  // OpenAPI route with Zod validation
  const validatedRoute = createRoute({
    method: 'post',
    path: '/validated',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              age: z.number().int().min(18),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: { description: 'OK' },
    },
  });

  app.openapi(validatedRoute, (c) => {
    return c.json({ ok: true }, 200);
  });

  return {
    request: (path: string, init?: RequestInit) =>
      app.request(path, init, { ENVIRONMENT: env.ENVIRONMENT ?? '' }),
  };
}

describe('onNotFound', () => {
  const { request } = createTestApp();

  it('returns 404 with standard error format', async () => {
    const res = await request('/nonexistent');
    expect(res.status).toBe(404);

    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.status).toBe(404);
    expect(body.error.message).toContain('/nonexistent');
  });
});

describe('onError', () => {
  it('handles HTTPException with correct status and code', async () => {
    const { request } = createTestApp();
    const res = await request('/http-error');
    expect(res.status).toBe(403);

    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.status).toBe(403);
    expect(body.error.message).toBe('Access denied');
  });

  it('handles unhandled errors as 500 in production', async () => {
    const { request } = createTestApp({ ENVIRONMENT: 'production' });
    const res = await request('/unhandled');
    expect(res.status).toBe(500);

    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.status).toBe(500);
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.stack).toBeUndefined();
  });

  it('includes error message and stack in development', async () => {
    const { request } = createTestApp({ ENVIRONMENT: 'development' });
    const res = await request('/unhandled');
    expect(res.status).toBe(500);

    const body = (await res.json()) as ErrorBody;
    expect(body.error.message).toBe('Something broke');
    expect(body.error.stack).toBeDefined();
  });
});

describe('validation errors (defaultHook)', () => {
  const { request } = createTestApp();

  it('returns 422 with field-level details for invalid input', async () => {
    const res = await request('/validated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', age: 10 }),
    });
    expect(res.status).toBe(422);

    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.status).toBe(422);
    expect(body.error.details).toBeInstanceOf(Array);
    expect(body.error.details!.length).toBeGreaterThanOrEqual(1);

    const paths = body.error.details!.map((d) => d.path.join('.'));
    expect(paths).toContain('email');
  });

  it('passes valid input through to handler', async () => {
    const res = await request('/validated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', age: 25 }),
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
