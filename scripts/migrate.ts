/**
 * Applies every .sql file in migrations/ in filename order, once.
 *
 *   npm run migrate
 *
 * Each file runs inside a transaction, so a failing migration leaves the
 * database exactly as it was.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

/**
 * Migrations need the ADMIN connection, not the app's. They create roles and
 * tables, which lumen_app deliberately cannot do.
 */
function adminDatabaseUrl(): string {
  const url = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Set ADMIN_DATABASE_URL (or DATABASE_URL) to an admin connection');
  }
  return url;
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

/**
 * Sets the lumen_app role's password, when LUMEN_APP_PASSWORD is present.
 *
 * Migration 0002 creates the role without a login, because a password must
 * never live in a committed migration. Deployment sets it from the secret
 * store; this lets a developer set it from .env without needing psql
 * installed at all.
 *
 * ALTER ROLE cannot take a bind parameter, so the password is passed as one to
 * set_config and quoted by format('%L') inside the server rather than
 * interpolated into SQL here.
 */
async function setAppRolePassword(pool: Pool, password: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['lumen.app_password', password]);
    await client.query(`DO $do$
      BEGIN
        EXECUTE format('ALTER ROLE lumen_app LOGIN PASSWORD %L',
                       current_setting('lumen.app_password'));
      END $do$;`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function migrate(databaseUrl: string): Promise<string[]> {
  const pool = new Pool({ connectionString: databaseUrl });
  const applied: string[] = [];
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);

    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rowCount } = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file],
      );
      if (rowCount) continue;

      const sql = await readFile(join(migrationsDir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
      } finally {
        client.release();
      }
    }
    const appPassword = process.env.LUMEN_APP_PASSWORD;
    if (appPassword) {
      if (appPassword.length < 8) {
        throw new Error('LUMEN_APP_PASSWORD must be at least 8 characters');
      }
      await setAppRolePassword(pool, appPassword);
    }

    return applied;
  } finally {
    await pool.end();
  }
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const applied = await migrate(adminDatabaseUrl());
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date.');
  if (process.env.LUMEN_APP_PASSWORD) {
    console.log('Set the lumen_app role password from LUMEN_APP_PASSWORD.');
  }
}
