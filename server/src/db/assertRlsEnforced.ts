import type { Pool } from 'pg';
import { getPool } from './pool.js';

/**
 * Fails startup if the application is connected as a role that bypasses row
 * level security.
 *
 * Postgres lets superusers and BYPASSRLS roles read every row regardless of
 * policy, with no error and no warning — the tenant boundary would simply not
 * be there. Pointing DATABASE_URL at a superuser is the easiest way to lose it
 * (it is what a local `postgres` connection string does), so this is checked
 * once, loudly, rather than discovered by a school seeing another school's
 * students.
 */
export async function assertRlsEnforced(pool: Pool = getPool()): Promise<void> {
  const { rows } = await pool.query<{
    role: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
  }>(
    `SELECT rolname AS role, rolsuper, rolbypassrls
       FROM pg_roles WHERE rolname = current_user`,
  );

  const role = rows[0];
  if (!role) throw new Error('Could not determine the current database role');

  if (role.rolsuper || role.rolbypassrls) {
    throw new Error(
      `Refusing to start: the database role "${role.role}" bypasses row level security ` +
        `(${role.rolsuper ? 'superuser' : 'BYPASSRLS'}), which disables the tenant boundary. ` +
        'Point DATABASE_URL at the lumen_app role created by migration 0002.',
    );
  }

  const { rows: unprotected } = await pool.query<{ tablename: string }>(
    `SELECT c.relname AS tablename
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND EXISTS (SELECT 1 FROM pg_attribute a
                     WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped)
        AND NOT c.relrowsecurity`,
  );

  if (unprotected.length > 0) {
    throw new Error(
      'Refusing to start: these tenant-scoped tables have no row level security — ' +
        unprotected.map((t) => t.tablename).join(', '),
    );
  }
}
