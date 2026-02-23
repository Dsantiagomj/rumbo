import { sql } from 'drizzle-orm';
import type { Bindings } from '../../app.js';
import { createDb } from '../../lib/db.js';

type DatabaseStatus = {
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
};

export async function getHealthStatus(env: Bindings) {
  const database = await checkDatabase(env);

  return {
    status: database.status === 'ok' ? ('ok' as const) : ('degraded' as const),
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT ?? 'unknown',
    database,
  };
}

async function checkDatabase(env: Bindings): Promise<DatabaseStatus> {
  try {
    const start = performance.now();
    const db = await createDb(env);
    await db.execute(sql`SELECT 1`);
    const latencyMs = Math.round(performance.now() - start);

    return { status: 'ok', latencyMs };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }
}
