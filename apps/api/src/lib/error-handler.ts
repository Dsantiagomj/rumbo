import type { Context, ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

function isZodError(err: Error): err is ZodError {
  return err instanceof ZodError;
}

function isDev(c: Context): boolean {
  const env = (c.env as Record<string, unknown>)?.ENVIRONMENT;
  return env !== 'production' && env !== 'staging';
}

export const onError: ErrorHandler = (err, c) => {
  if (isZodError(err)) {
    return c.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          status: 422,
          details: err.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
      },
      422,
    );
  }

  if (err instanceof HTTPException) {
    const status = err.status as ContentfulStatusCode;
    return c.json(
      {
        error: {
          message: err.message,
          code: httpStatusToCode(status),
          status,
          ...(isDev(c) && err.stack ? { stack: err.stack } : {}),
        },
      },
      status,
    );
  }

  const requestId = c.get('requestId') as string | undefined;

  console.error(
    JSON.stringify({
      level: 'error',
      message: err.message,
      code: 'INTERNAL_SERVER_ERROR',
      method: c.req.method,
      path: c.req.path,
      requestId,
      timestamp: new Date().toISOString(),
      stack: err.stack,
    }),
  );

  return c.json(
    {
      error: {
        message: isDev(c) ? err.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        ...(requestId ? { requestId } : {}),
        ...(isDev(c) && err.stack ? { stack: err.stack } : {}),
      },
    },
    500,
  );
};

export const onNotFound: NotFoundHandler = (c) => {
  return c.json(
    {
      error: {
        message: `Route not found: ${c.req.method} ${c.req.path}`,
        code: 'NOT_FOUND',
        status: 404,
      },
    },
    404,
  );
};

function httpStatusToCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
  };
  return codes[status] ?? `HTTP_${status}`;
}
