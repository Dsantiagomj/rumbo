import { serve } from '@hono/node-server';
import type { Bindings } from './app.js';
import { app } from './app.js';

const port = Number(process.env.API_PORT) || 3000;

const env: Bindings = {
  ENVIRONMENT: process.env.ENVIRONMENT ?? 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? '',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? '',
  APP_URL: process.env.APP_URL ?? '',
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'Rumbo <onboarding@resend.dev>',
};

console.log(`Rumbo API starting on http://localhost:${port}`);

serve({
  fetch: (req) => app.fetch(req, env),
  port,
});
