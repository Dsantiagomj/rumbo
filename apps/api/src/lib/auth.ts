import { neon } from '@neondatabase/serverless';
import * as schema from '@rumbo/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/neon-http';
import type { Bindings } from '../app.js';

const authCache = new Map<string, ReturnType<typeof betterAuth>>();

export function getAuth(env: Bindings) {
  const cacheKey = `${env.DATABASE_URL}|${env.BETTER_AUTH_SECRET}|${env.BETTER_AUTH_URL}`;
  const cached = authCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
  });
  authCache.set(cacheKey, auth);

  return auth;
}
