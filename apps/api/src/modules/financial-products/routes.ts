import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { PRODUCT_TYPE_METADATA_MAP } from '@rumbo/shared/schemas';
import type { AuthedEnv } from '../../app.js';
import { createDb } from '../../lib/db.js';
import { errorResponseSchema, validationErrorResponseSchema } from '../../lib/error-schemas.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './service.js';
import {
  createProductBodySchema,
  productIdParamSchema,
  productListResponse,
  productResponse,
  updateProductBodySchema,
} from './validation.js';

// -- Route definitions --

const listProductsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Financial Products'],
  summary: 'List user financial products',
  responses: {
    200: {
      content: { 'application/json': { schema: productListResponse } },
      description: 'List of financial products',
    },
  },
});

const createProductRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Financial Products'],
  summary: 'Create a financial product',
  request: {
    body: {
      content: { 'application/json': { schema: createProductBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: productResponse } },
      description: 'Product created successfully',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

const getProductRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Financial Products'],
  summary: 'Get a financial product by ID',
  request: {
    params: productIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: productResponse } },
      description: 'Financial product found',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Product not found',
    },
  },
});

const updateProductRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Financial Products'],
  summary: 'Update a financial product',
  request: {
    params: productIdParamSchema,
    body: {
      content: { 'application/json': { schema: updateProductBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: productResponse } },
      description: 'Product updated successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Product not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Financial Products'],
  summary: 'Delete a financial product',
  request: {
    params: productIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: productResponse } },
      description: 'Product deleted successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Product not found',
    },
  },
});

// -- Router and handlers --

const financialProductsRouter = new OpenAPIHono<AuthedEnv>({
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

financialProductsRouter.openapi(listProductsRoute, async (c) => {
  const user = c.get('user');
  const db = await createDb(c.env);
  const products = await listProducts(db, user.id);
  return c.json({ products }, 200);
});

financialProductsRouter.openapi(createProductRoute, async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  // Validate metadata against the specific product type
  const metadataSchema = PRODUCT_TYPE_METADATA_MAP[body.type];
  const metadataResult = metadataSchema.safeParse(body.metadata ?? {});

  if (!metadataResult.success) {
    return c.json(
      {
        error: {
          message: 'Invalid metadata for product type',
          code: 'VALIDATION_ERROR' as const,
          status: 422 as const,
          details: metadataResult.error.issues.map((issue) => ({
            path: ['metadata', ...issue.path] as (string | number)[],
            message: issue.message,
          })),
        },
      },
      422,
    );
  }

  const db = await createDb(c.env);
  const product = await createProduct(db, user.id, {
    ...body,
    metadata: metadataResult.data,
  });
  return c.json(product, 201);
});

financialProductsRouter.openapi(getProductRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  const product = await getProduct(db, user.id, id);

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

  return c.json(product, 200);
});

financialProductsRouter.openapi(updateProductRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const db = await createDb(c.env);

  // If metadata is included, validate it against the product's type
  if (body.metadata !== undefined) {
    const existing = await getProduct(db, user.id, id);

    if (!existing) {
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

    const metadataSchema = PRODUCT_TYPE_METADATA_MAP[existing.type];
    const metadataResult = metadataSchema.safeParse(body.metadata);

    if (!metadataResult.success) {
      return c.json(
        {
          error: {
            message: 'Invalid metadata for product type',
            code: 'VALIDATION_ERROR' as const,
            status: 422 as const,
            details: metadataResult.error.issues.map((issue) => ({
              path: ['metadata', ...issue.path] as (string | number)[],
              message: issue.message,
            })),
          },
        },
        422,
      );
    }
  }

  const product = await updateProduct(db, user.id, id, body);

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

  return c.json(product, 200);
});

financialProductsRouter.openapi(deleteProductRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  const product = await deleteProduct(db, user.id, id);

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

  return c.json(product, 200);
});

export { financialProductsRouter };
