import { account, session, user, verification } from '@rumbo/db/schema';
import { describe, expect, it } from 'vitest';
import { getAuth } from '../auth.js';

/**
 * Better Auth expects these exact columns (camelCase ORM names)
 * on each table. If the schema drifts, these tests catch it
 * before a runtime failure.
 */
describe('Better Auth schema compatibility', () => {
  it('user table has all required columns', () => {
    const required = ['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt'];
    for (const col of required) {
      expect(col in user, `user missing column: ${col}`).toBe(true);
    }
  });

  it('session table has all required columns', () => {
    const required = [
      'id',
      'userId',
      'token',
      'expiresAt',
      'ipAddress',
      'userAgent',
      'createdAt',
      'updatedAt',
    ];
    for (const col of required) {
      expect(col in session, `session missing column: ${col}`).toBe(true);
    }
  });

  it('account table has all required columns', () => {
    const required = [
      'id',
      'userId',
      'accountId',
      'providerId',
      'accessToken',
      'refreshToken',
      'idToken',
      'accessTokenExpiresAt',
      'refreshTokenExpiresAt',
      'scope',
      'password',
      'createdAt',
      'updatedAt',
    ];
    for (const col of required) {
      expect(col in account, `account missing column: ${col}`).toBe(true);
    }
  });

  it('verification table has all required columns', () => {
    const required = ['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'];
    for (const col of required) {
      expect(col in verification, `verification missing column: ${col}`).toBe(true);
    }
  });
});

describe('getAuth', () => {
  it('returns an auth instance with a handler', () => {
    const auth = getAuth({
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-chars-long',
      BETTER_AUTH_URL: 'http://localhost:3000',
      ENVIRONMENT: 'test',
    });

    expect(auth).toBeDefined();
    expect(auth.handler).toBeTypeOf('function');
  });
});
