import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.API_PORT) || 3000;

console.log(`Rumbo API starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
