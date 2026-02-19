import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getAuth } from './lib/auth.js';
import { onError, onNotFound } from './lib/error-handler.js';
import { health } from './modules/health/index.js';

export type Bindings = {
  ENVIRONMENT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGINS: string;
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

// Auth routes (Better Auth handles /api/auth/* automatically)
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  const auth = getAuth(c.env);
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
