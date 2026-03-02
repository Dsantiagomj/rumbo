import { z } from '@hono/zod-openapi';
import { trmRateResponseSchema } from '@rumbo/shared/schemas';

export const trmRateResponse = trmRateResponseSchema.openapi('TrmRate');

export const trmUnavailableResponseSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: 'TRM rate is currently unavailable' }),
      code: z.string().openapi({ example: 'TRM_UNAVAILABLE' }),
      status: z.number().int().openapi({ example: 503 }),
    }),
  })
  .openapi('TrmUnavailableResponse');
