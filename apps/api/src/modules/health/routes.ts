import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '../../app.js';
import { getHealthStatus } from './service.js';
import { healthResponseSchema } from './validation.js';

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check with database connectivity',
  responses: {
    200: {
      content: { 'application/json': { schema: healthResponseSchema } },
      description: 'Service health status',
    },
  },
});

const health = new OpenAPIHono<AppEnv>();

health.openapi(healthRoute, async (c) => {
  const status = await getHealthStatus(c.env);
  return c.json(status, 200);
});

export { health };
