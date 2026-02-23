import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getAuth, pendingEmailPromises } from './lib/auth.js';
import { authMiddleware } from './lib/auth-middleware.js';
import { onError, onNotFound } from './lib/error-handler.js';
import { requestId } from './lib/request-id.js';
import { categoriesRouter } from './modules/categories/index.js';
import { financialProductsRouter } from './modules/financial-products/index.js';
import { health } from './modules/health/index.js';
import { productTransactionsRouter, transactionsRouter } from './modules/transactions/index.js';

export type Bindings = {
  ENVIRONMENT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  APP_URL: string;
  CORS_ORIGINS: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Variables = {
  requestId: string;
  user?: AuthUser;
  session?: AuthSession;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
export type AuthedEnv = { Bindings: Bindings; Variables: { user: AuthUser; session: AuthSession } };

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
app.use('*', requestId);
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = c.env as Partial<Bindings> | undefined;
      const allowed = (env?.CORS_ORIGINS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return allowed.some((pattern) => {
        if (pattern.startsWith('*.')) {
          const suffix = pattern.slice(1); // ".rumbo.pages.dev"
          return origin.endsWith(suffix) && origin.includes('://');
        }
        return pattern === origin;
      })
        ? origin
        : null;
    },
    credentials: true,
  }),
);

// Routes
app.route('/health', health);

app.use('/api/categories/*', authMiddleware);
app.route('/api/categories', categoriesRouter);

app.use('/api/financial-products/*', authMiddleware);
app.route('/api/financial-products', financialProductsRouter);
app.route('/api/financial-products', productTransactionsRouter);

app.use('/api/transactions/*', authMiddleware);
app.route('/api/transactions', transactionsRouter);

// Auth routes (Better Auth handles /api/auth/* automatically)
app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
  const auth = await getAuth(c.env);
  const response = await auth.handler(c.req.raw);

  // Keep worker alive until background email sends complete.
  // Better Auth fires sendResetPassword without awaiting it (timing attack prevention),
  // so on Cloudflare Workers the isolate would die before Resend finishes.
  // On Node.js dev server, executionCtx doesn't exist (getter throws), so we catch and ignore.
  if (pendingEmailPromises.length > 0) {
    const drain = Promise.allSettled(pendingEmailPromises.splice(0));
    try {
      c.executionCtx.waitUntil(drain);
    } catch {
      // Node.js dev server — no executionCtx, promises resolve on their own
    }
  }

  return response;
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
