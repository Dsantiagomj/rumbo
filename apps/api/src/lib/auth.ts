import { neon } from '@neondatabase/serverless';
import * as schema from '@rumbo/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Bindings } from '../app.js';
import { createResendClient, sendResetPasswordEmail, sendVerificationEmail } from './email.js';

const authCache = new Map<string, ReturnType<typeof betterAuth>>();

function createDb(env: Bindings) {
  if (env.ENVIRONMENT === 'development') {
    const sql = postgres(env.DATABASE_URL);
    return drizzlePostgres(sql, { schema });
  }
  const sql = neon(env.DATABASE_URL);
  return drizzleNeon(sql, { schema });
}

export function getAuth(env: Bindings) {
  const cacheKey = `${env.DATABASE_URL}|${env.BETTER_AUTH_SECRET}|${env.BETTER_AUTH_URL}|${env.RESEND_API_KEY}`;
  const cached = authCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = createDb(env);
  const resend = createResendClient(env.RESEND_API_KEY);
  const emailFrom = env.EMAIL_FROM;

  const trustedOrigins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

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
    trustedOrigins,
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail(resend, emailFrom, user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(resend, emailFrom, user.email, url);
      },
    },
  });
  authCache.set(cacheKey, auth);

  return auth;
}
