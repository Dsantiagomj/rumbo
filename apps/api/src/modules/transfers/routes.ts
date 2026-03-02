import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { AuthedEnv } from '../../app.js';
import { createDb } from '../../lib/db.js';
import { errorResponseSchema, validationErrorResponseSchema } from '../../lib/error-schemas.js';
import { InsufficientBalanceError } from '../../lib/errors.js';
import { TRMUnavailableError } from '../trm/service.js';
import { createTransfer } from './service.js';
import { createTransferBodySchema, createTransferResponse } from './validation.js';

const createTransferRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Transfers'],
  summary: 'Create a transfer between two financial products',
  request: {
    body: {
      content: { 'application/json': { schema: createTransferBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: createTransferResponse } },
      description: 'Transfer created successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Financial product not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error or insufficient balance',
    },
  },
});

const transfersRouter = new OpenAPIHono<AuthedEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR' as const,
            status: 422 as const,
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

transfersRouter.openapi(createTransferRoute, async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const db = await createDb(c.env);

  if (body.sourceProductId === body.destinationProductId) {
    return c.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR' as const,
          status: 422 as const,
          details: [
            {
              path: ['destinationProductId'] as (string | number)[],
              message: 'Source and destination must be different',
            },
          ],
        },
      },
      422,
    );
  }

  try {
    const result = await createTransfer(db, user.id, body);

    if (!result) {
      return c.json(
        {
          error: {
            message: 'Financial product not found',
            code: 'NOT_FOUND',
            status: 404,
          },
        },
        404,
      );
    }

    return c.json(result, 201);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return c.json(
        {
          error: {
            message: error.message,
            code: 'VALIDATION_ERROR' as const,
            status: 422 as const,
            details: [{ path: ['amount'] as (string | number)[], message: error.message }],
          },
        },
        422,
      );
    }
    if (error instanceof TRMUnavailableError) {
      return c.json(
        {
          error: {
            message: error.message,
            code: 'VALIDATION_ERROR' as const,
            status: 422 as const,
            details: [{ path: ['exchangeRate'] as (string | number)[], message: error.message }],
          },
        },
        422,
      );
    }
    throw error;
  }
});

export { transfersRouter };
