import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { AuthedEnv } from '../../app.js';
import { createDb } from '../../lib/db.js';
import { errorResponseSchema, validationErrorResponseSchema } from '../../lib/error-schemas.js';
import { InsufficientBalanceError } from '../../lib/errors.js';
import {
  createTransaction,
  deleteTransaction,
  getBalanceHistory,
  getTransaction,
  listTransactions,
  updateTransaction,
  verifyProductOwnership,
} from './service.js';
import {
  balanceHistoryQuerySchema,
  balanceHistoryResponse,
  createTransactionBodySchema,
  productIdParamSchema,
  transactionIdParamSchema,
  transactionListResponse,
  transactionQuerySchema,
  transactionResponse,
  updateTransactionBodySchema,
} from './validation.js';

// -- Route definitions: nested under /api/financial-products/{productId}/transactions --

const listTransactionsRoute = createRoute({
  method: 'get',
  path: '/{productId}/transactions',
  tags: ['Transactions'],
  summary: 'List transactions for a financial product',
  request: {
    params: productIdParamSchema,
    query: transactionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: transactionListResponse } },
      description: 'List of transactions',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Financial product not found',
    },
  },
});

const createTransactionRoute = createRoute({
  method: 'post',
  path: '/{productId}/transactions',
  tags: ['Transactions'],
  summary: 'Create a transaction for a financial product',
  request: {
    params: productIdParamSchema,
    body: {
      content: { 'application/json': { schema: createTransactionBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: transactionResponse } },
      description: 'Transaction created successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Financial product not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

// -- Route definitions: flat at /api/transactions --

const balanceHistoryRoute = createRoute({
  method: 'get',
  path: '/balance-history',
  tags: ['Transactions'],
  summary: 'Get daily cumulative balance history for all products',
  request: {
    query: balanceHistoryQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: balanceHistoryResponse } },
      description: 'Daily balance history',
    },
  },
});

const getTransactionRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Get a transaction by ID',
  request: {
    params: transactionIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: transactionResponse } },
      description: 'Transaction found',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Transaction not found',
    },
  },
});

const updateTransactionRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Update a transaction',
  request: {
    params: transactionIdParamSchema,
    body: {
      content: { 'application/json': { schema: updateTransactionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: transactionResponse } },
      description: 'Transaction updated successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Transaction not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

const deleteTransactionRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Delete a transaction',
  request: {
    params: transactionIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: transactionResponse } },
      description: 'Transaction deleted successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Transaction not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

// -- Routers and handlers --

const productTransactionsRouter = new OpenAPIHono<AuthedEnv>({
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

productTransactionsRouter.openapi(listTransactionsRoute, async (c) => {
  const user = c.get('user');
  const { productId } = c.req.valid('param');
  const query = c.req.valid('query');
  const db = await createDb(c.env);

  const result = await listTransactions(db, user.id, productId, {
    search: query.search,
    startDate: query.start_date,
    endDate: query.end_date,
    types: query.types?.split(','),
    categories: query.categories?.split(','),
    amountMin: query.amount_min,
    amountMax: query.amount_max,
    cursor: query.cursor,
    limit: query.limit ?? 25,
  });

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

  return c.json(result, 200);
});

productTransactionsRouter.openapi(createTransactionRoute, async (c) => {
  const user = c.get('user');
  const { productId } = c.req.valid('param');
  const body = c.req.valid('json');
  const db = await createDb(c.env);

  const product = await verifyProductOwnership(db, user.id, productId);
  if (!product) {
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

  try {
    const transaction = await createTransaction(db, productId, body);
    return c.json(transaction, 201);
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
    throw error;
  }
});

const transactionsRouter = new OpenAPIHono<AuthedEnv>({
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

transactionsRouter.openapi(balanceHistoryRoute, async (c) => {
  const user = c.get('user');
  const { currency } = c.req.valid('query');
  const db = await createDb(c.env);
  const result = await getBalanceHistory(db, user.id, currency);
  return c.json(result, 200);
});

transactionsRouter.openapi(getTransactionRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  const transaction = await getTransaction(db, user.id, id);

  if (!transaction) {
    return c.json(
      {
        error: {
          message: 'Transaction not found',
          code: 'NOT_FOUND',
          status: 404,
        },
      },
      404,
    );
  }

  return c.json(transaction, 200);
});

transactionsRouter.openapi(updateTransactionRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const db = await createDb(c.env);
  try {
    const transaction = await updateTransaction(db, user.id, id, body);

    if (!transaction) {
      return c.json(
        {
          error: {
            message: 'Transaction not found',
            code: 'NOT_FOUND',
            status: 404,
          },
        },
        404,
      );
    }

    return c.json(transaction, 200);
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
    throw error;
  }
});

transactionsRouter.openapi(deleteTransactionRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  try {
    const transaction = await deleteTransaction(db, user.id, id);

    if (!transaction) {
      return c.json(
        {
          error: {
            message: 'Transaction not found',
            code: 'NOT_FOUND',
            status: 404,
          },
        },
        404,
      );
    }

    return c.json(transaction, 200);
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
    throw error;
  }
});

export { productTransactionsRouter, transactionsRouter };
