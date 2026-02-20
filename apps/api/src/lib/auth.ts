import * as schema from '@rumbo/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Bindings } from '../app.js';
import { createDb } from './db.js';
import { createResendClient, sendResetPasswordEmail, sendVerificationEmail } from './email.js';
import { hashPassword, verifyPassword } from './password.js';

const authCache = new Map<string, ReturnType<typeof betterAuth>>();

export async function getAuth(env: Bindings) {
  const cacheKey = `${env.DATABASE_URL}|${env.BETTER_AUTH_SECRET}|${env.BETTER_AUTH_URL}|${env.RESEND_API_KEY}`;
  const cached = authCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = await createDb(env);
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
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      sendResetPassword: async ({ user, url }) => {
        const token = new URL(url).searchParams.get('token') ?? '';
        const frontendUrl = `${trustedOrigins[0]}/reset-password?token=${token}`;
        await sendResetPasswordEmail(resend, emailFrom, user.email, frontendUrl);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const token = new URL(url).searchParams.get('token') ?? '';
          const frontendUrl = `${trustedOrigins[0]}/verify-email?token=${token}`;
          console.log('[auth] verification email url:', frontendUrl);
          await sendVerificationEmail(resend, emailFrom, user.email, frontendUrl);
        } catch (error) {
          console.error('[auth] failed to send verification email:', error);
        }
      },
    },
  });
  authCache.set(cacheKey, auth);

  return auth;
}
