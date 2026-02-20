import * as schema from '@rumbo/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Bindings } from '../app.js';
import { createDb } from './db.js';
import { createResendClient, sendResetPasswordEmail, sendVerificationEmail } from './email.js';
import { hashPassword, verifyPassword } from './password.js';

const authCache = new Map<string, ReturnType<typeof betterAuth>>();

// Pending email promises that must be kept alive via waitUntil() on Cloudflare Workers.
// Better Auth does NOT await sendResetPassword (timing attack prevention), so the worker
// would terminate before the Resend API call completes without this.
export const pendingEmailPromises: Promise<void>[] = [];

export async function getAuth(env: Bindings) {
  const cacheKey = `${env.DATABASE_URL}|${env.BETTER_AUTH_SECRET}|${env.BETTER_AUTH_URL}|${env.RESEND_API_KEY}|${env.APP_URL}`;
  const cached = authCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = await createDb(env);
  const resend = createResendClient(env.RESEND_API_KEY);
  const emailFrom = env.EMAIL_FROM;
  const isProd = env.ENVIRONMENT === 'production' || env.ENVIRONMENT === 'staging';

  const trustedOrigins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const appUrl =
    env.APP_URL || trustedOrigins.find((origin) => origin && !origin.includes('*')) || '';

  if (!appUrl) {
    console.warn(
      '[auth] APP_URL is not configured — password reset and verification emails will fail',
    );
  }

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
    advanced: {
      defaultCookieAttributes: {
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        partitioned: isProd,
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      sendResetPassword: ({ user, token }) => {
        const promise = (async () => {
          try {
            if (!appUrl) {
              throw new Error('APP_URL_NOT_CONFIGURED');
            }
            const frontendUrl = `${appUrl}/reset-password?token=${token}`;
            await sendResetPasswordEmail(resend, emailFrom, user.email, frontendUrl);
          } catch (error) {
            console.error('[auth] failed to send reset password email:', error);
          }
        })();
        pendingEmailPromises.push(promise);
        return promise;
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, token }) => {
        const promise = (async () => {
          try {
            if (!appUrl) {
              throw new Error('APP_URL_NOT_CONFIGURED');
            }
            const frontendUrl = `${appUrl}/verify-email?token=${token}`;
            await sendVerificationEmail(resend, emailFrom, user.email, frontendUrl);
          } catch (error) {
            console.error('[auth] failed to send verification email:', error);
          }
        })();
        pendingEmailPromises.push(promise);
        return promise;
      },
    },
  });
  authCache.set(cacheKey, auth);

  return auth;
}
