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
import { loadConfig } from '../src/config.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

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
    return applied;
  } finally {
    await pool.end();
  }
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const applied = await migrate(loadConfig().databaseUrl);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date.');
}
