import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
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

const app = new OpenAPIHono<AppEnv>();

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
