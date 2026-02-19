import { createMiddleware } from 'hono/factory';
import type { AuthedEnv } from '../app.js';
import { getAuth } from './auth.js';

export const authMiddleware = createMiddleware<AuthedEnv>(async (c, next) => {
  const auth = getAuth(c.env);
  const result = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!result) {
    return c.json(
      {
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          status: 401,
        },
      },
      401,
    );
  }

  c.set('user', result.user);
  c.set('session', result.session);
  await next();
});
