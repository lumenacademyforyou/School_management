import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { assertRlsEnforced } from '../../src/db/assertRlsEnforced.js';
import { ADMIN_DATABASE_URL, closeAdminPool, createTestPool, setupSchema } from './harness.js';

let appPool: Pool;
let adminPool: Pool;

beforeAll(async () => {
  await setupSchema();
  appPool = createTestPool();
  adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL, max: 1 });
});

afterAll(async () => {
  await appPool.end();
  await adminPool.end();
  await closeAdminPool();
});

describe('assertRlsEnforced', () => {
  it('accepts the unprivileged application role', async () => {
    await expect(assertRlsEnforced(appPool)).resolves.toBeUndefined();
  });

  it('refuses a superuser connection, which would silently disable the boundary', async () => {
    await expect(assertRlsEnforced(adminPool)).rejects.toThrow(/bypasses row level security/);
  });

  it('refuses to start when a tenant-scoped table is missing its policy', async () => {
    await adminPool.query(`
      CREATE TABLE IF NOT EXISTS forgotten_table (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL
      )`);
    try {
      await expect(assertRlsEnforced(appPool)).rejects.toThrow(/forgotten_table/);
    } finally {
      await adminPool.query('DROP TABLE IF EXISTS forgotten_table');
    }
  });
});
