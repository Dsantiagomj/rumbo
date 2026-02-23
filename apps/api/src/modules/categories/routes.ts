import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { AuthedEnv } from '../../app.js';
import { createDb } from '../../lib/db.js';
import { errorResponseSchema, validationErrorResponseSchema } from '../../lib/error-schemas.js';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from './service.js';
import {
  categoryIdParamSchema,
  categoryListResponse,
  categoryResponse,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from './validation.js';

// -- Route definitions --

const listCategoriesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Categories'],
  summary: 'List user categories',
  responses: {
    200: {
      content: { 'application/json': { schema: categoryListResponse } },
      description: 'List of categories (user-created + defaults)',
    },
  },
});

const createCategoryRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Categories'],
  summary: 'Create a category',
  request: {
    body: {
      content: { 'application/json': { schema: createCategoryBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: categoryResponse } },
      description: 'Category created successfully',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

const getCategoryRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Get a category by ID',
  request: {
    params: categoryIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: categoryResponse } },
      description: 'Category found',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Category not found',
    },
  },
});

const updateCategoryRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Update a category',
  request: {
    params: categoryIdParamSchema,
    body: {
      content: { 'application/json': { schema: updateCategoryBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: categoryResponse } },
      description: 'Category updated successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Category not found',
    },
    422: {
      content: { 'application/json': { schema: validationErrorResponseSchema } },
      description: 'Validation error',
    },
  },
});

const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Delete a category',
  request: {
    params: categoryIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: categoryResponse } },
      description: 'Category deleted successfully',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Category not found',
    },
  },
});

// -- Router and handlers --

const categoriesRouter = new OpenAPIHono<AuthedEnv>({
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

categoriesRouter.openapi(listCategoriesRoute, async (c) => {
  const user = c.get('user');
  const db = await createDb(c.env);
  const categories = await listCategories(db, user.id);
  return c.json({ categories }, 200);
});

categoriesRouter.openapi(createCategoryRoute, async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const db = await createDb(c.env);
  const category = await createCategory(db, user.id, body);
  return c.json(category, 201);
});

categoriesRouter.openapi(getCategoryRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  const category = await getCategory(db, user.id, id);

  if (!category) {
    return c.json(
      {
        error: {
          message: 'Category not found',
          code: 'NOT_FOUND',
          status: 404,
        },
      },
      404,
    );
  }

  return c.json(category, 200);
});

categoriesRouter.openapi(updateCategoryRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const db = await createDb(c.env);
  const category = await updateCategory(db, user.id, id, body);

  if (!category) {
    return c.json(
      {
        error: {
          message: 'Category not found',
          code: 'NOT_FOUND',
          status: 404,
        },
      },
      404,
    );
  }

  return c.json(category, 200);
});

categoriesRouter.openapi(deleteCategoryRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const db = await createDb(c.env);
  const category = await deleteCategory(db, user.id, id);

  if (!category) {
    return c.json(
      {
        error: {
          message: 'Category not found',
          code: 'NOT_FOUND',
          status: 404,
        },
      },
      404,
    );
  }

  return c.json(category, 200);
});

export { categoriesRouter };
