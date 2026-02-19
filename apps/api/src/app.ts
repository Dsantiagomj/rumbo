import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createAuth } from './lib/auth.js';
import { onError, onNotFound } from './lib/error-handler.js';
import { health } from './modules/health/index.js';

export type Bindings = {
  ENVIRONMENT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

// biome-ignore lint/complexity/noBannedTypes: Variables will be populated as features are added (e.g., user session)
export type Variables = {};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

const app = new OpenAPIHono<AppEnv>({
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

// Error handling
app.onError(onError);
app.notFound(onNotFound);

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://rumbo.pages.dev'],
    credentials: true,
  }),
);

// Routes
app.route('/health', health);

// Auth routes (Better Auth handles /api/auth/* automatically)
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Rumbo API',
    version: '0.1.0',
    description: 'Personal finance management API for the Colombian context',
  },
});

app.get(
  '/reference',
  apiReference({
    url: '/openapi.json',
    theme: 'default',
  }),
);

export { app };
