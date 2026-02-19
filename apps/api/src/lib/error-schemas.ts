import { z } from '@hono/zod-openapi';

export const errorResponseSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: 'Resource not found' }),
      code: z.string().openapi({ example: 'NOT_FOUND' }),
      status: z.number().int().openapi({ example: 404 }),
      stack: z.string().optional().openapi({ description: 'Stack trace (development only)' }),
    }),
  })
  .openapi('ErrorResponse');

export const validationErrorResponseSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: 'Validation failed' }),
      code: z.literal('VALIDATION_ERROR').openapi({ example: 'VALIDATION_ERROR' }),
      status: z.literal(422).openapi({ example: 422 }),
      details: z
        .array(
          z.object({
            path: z
              .array(z.union([z.string(), z.number()]))
              .openapi({ example: ['body', 'email'] }),
            message: z.string().openapi({ example: 'Invalid email address' }),
          }),
        )
        .openapi({ description: 'Field-level validation errors' }),
    }),
  })
  .openapi('ValidationErrorResponse');
