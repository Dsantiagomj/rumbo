import { z } from '@hono/zod-openapi';

const databaseStatusSchema = z
  .object({
    status: z.enum(['ok', 'error']).openapi({ example: 'ok' }),
    latencyMs: z.number().optional().openapi({ example: 45 }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message when database is unreachable' }),
  })
  .openapi('DatabaseStatus');

export const healthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']).openapi({ example: 'ok' }),
    timestamp: z.string().datetime().openapi({ example: '2026-02-23T12:00:00.000Z' }),
    environment: z.string().openapi({ example: 'production' }),
    database: databaseStatusSchema,
  })
  .openapi('HealthResponse');
