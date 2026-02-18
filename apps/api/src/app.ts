import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { health } from './modules/health/index.js';

const app = new Hono();

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
