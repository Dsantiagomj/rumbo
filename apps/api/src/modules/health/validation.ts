import { z } from '@hono/zod-openapi';

export const healthResponseSchema = z
  .object({
    status: z.enum(['ok']).openapi({ example: 'ok' }),
    timestamp: z.string().datetime().openapi({ example: '2026-02-18T12:00:00.000Z' }),
  })
  .openapi('HealthResponse');
