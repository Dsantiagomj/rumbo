import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
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

export { app };
