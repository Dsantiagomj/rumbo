import { Hono } from 'hono';
import { getHealthStatus } from './service.js';

const health = new Hono();

health.get('/', (c) => {
  const status = getHealthStatus();
  return c.json(status);
});

export { health };
