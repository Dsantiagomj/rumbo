import { createTransferBaseSchema, createTransferResponseSchema } from '@rumbo/shared/schemas';

export const createTransferBodySchema = createTransferBaseSchema.openapi('CreateTransfer');

export const createTransferResponse =
  createTransferResponseSchema.openapi('CreateTransferResponse');
