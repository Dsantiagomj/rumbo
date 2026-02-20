import { neon } from '@neondatabase/serverless';
import * as schema from '@rumbo/db/schema';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import type { Bindings } from '../app.js';

export async function createDb(env: Bindings) {
  if (env.ENVIRONMENT === 'development') {
    const { default: postgres } = await import('postgres');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const sql = postgres(env.DATABASE_URL);
    return drizzle(sql, { schema });
  }
  const sql = neon(env.DATABASE_URL);
  return drizzleNeon(sql, { schema });
}

export type AppDatabase = Awaited<ReturnType<typeof createDb>>;
