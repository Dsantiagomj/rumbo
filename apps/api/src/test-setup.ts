// Extend Zod with .openapi() method before any test module loads.
// This is needed because @rumbo/shared schemas use plain `zod`,
// and validation.ts calls .openapi() on them at module level.
// @hono/zod-openapi normally extends Zod's prototype at import time,
// but Vitest's module isolation can cause ordering issues.
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);
