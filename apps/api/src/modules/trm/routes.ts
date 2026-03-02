import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { AuthedEnv } from '../../app.js';
import { getCurrentTRM, TRMUnavailableError } from './service.js';
import { trmRateResponse, trmUnavailableResponseSchema } from './validation.js';

const getTrmCurrentRoute = createRoute({
  method: 'get',
  path: '/current',
  tags: ['TRM'],
  summary: 'Get current TRM (Tasa Representativa del Mercado) rate',
  responses: {
    200: {
      content: { 'application/json': { schema: trmRateResponse } },
      description: 'Current TRM rate',
    },
    503: {
      content: { 'application/json': { schema: trmUnavailableResponseSchema } },
      description: 'TRM rate is currently unavailable',
    },
  },
});

export const trmRouter = new OpenAPIHono<AuthedEnv>();

trmRouter.openapi(getTrmCurrentRoute, async (c) => {
  try {
    const trm = await getCurrentTRM();
    return c.json(
      {
        rate: trm.rate.toString(),
        date: trm.date,
        source: 'datos.gov.co',
      },
      200,
    );
  } catch (error) {
    if (error instanceof TRMUnavailableError) {
      return c.json(
        {
          error: {
            message: 'TRM rate is currently unavailable',
            code: 'TRM_UNAVAILABLE',
            status: 503,
          },
        },
        503,
      );
    }
    throw error;
  }
});
