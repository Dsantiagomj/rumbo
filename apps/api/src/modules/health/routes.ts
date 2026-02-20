import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { getHealthStatus } from './service.js';
import { healthResponseSchema } from './validation.js';

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      content: { 'application/json': { schema: healthResponseSchema } },
      description: 'Service is healthy',
    },
  },
});

const health = new OpenAPIHono();

health.openapi(healthRoute, (c) => {
  const status = getHealthStatus();
  return c.json(status, 200);
});

export { health };
