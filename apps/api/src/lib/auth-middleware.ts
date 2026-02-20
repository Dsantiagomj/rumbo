import { createMiddleware } from 'hono/factory';
import type { AuthedEnv } from '../app.js';
import { getAuth } from './auth.js';

export const authMiddleware = createMiddleware<AuthedEnv>(async (c, next) => {
  try {
    const auth = await getAuth(c.env);
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
  } catch (error) {
    console.error('Auth session check failed:', error);
    return c.json(
      {
        error: {
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
          status: 500,
        },
      },
      500,
    );
  }
});
