import type { Pool, PoolClient } from 'pg';
import { getPool } from './pool.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs `fn` inside a transaction whose session is pinned to one tenant.
 *
 * `SET LOCAL` (via set_config(..., is_local => true)) scopes the setting to the
 * transaction, so the connection carries no tenant context once it returns to
 * the pool — a leaked context would be the exact bug row level security is
 * there to prevent.
 *
 * Every read or write of a tenant-scoped table must go through this. Queries
 * run outside it see nothing, by design.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
  pool: Pool = getPool(),
): Promise<T> {
  if (!UUID_RE.test(tenantId)) {
    throw new Error(`withTenant called with a non-uuid tenant id: "${tenantId}"`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * For the few statements that legitimately sit outside any tenant: resolving a
 * tenant by slug at login, and platform administration. Tenant-scoped tables
 * stay invisible here because no tenant context is set.
 */
export async function withoutTenant<T>(
  fn: (client: PoolClient) => Promise<T>,
  pool: Pool = getPool(),
): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
