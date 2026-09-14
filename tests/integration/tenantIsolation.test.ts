/**
 * The acceptance criterion for this story: a user in one tenant cannot read
 * another tenant's data. These tests prove it at the database layer, where the
 * guarantee actually lives.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import { withTenant, withoutTenant } from '../../src/db/tenantContext.js';
import { findUserById, listUsers } from '../../src/repositories/userRepository.js';
import {
  closeAdminPool,
  createTestPool,
  resetData,
  seedStudent,
  seedTwoSchools,
  setupSchema,
  type SeededTenant,
} from './harness.js';

let pool: Pool;
let northwood: SeededTenant;
let riverside: SeededTenant;

beforeAll(async () => {
  await setupSchema();
  pool = createTestPool();
});

afterAll(async () => {
  await pool.end();
  await closeAdminPool();
});

beforeEach(async () => {
  await resetData();
  ({ northwood, riverside } = await seedTwoSchools(pool));
  await seedStudent(pool, northwood.id, 'Nadia Northwood');
  await seedStudent(pool, riverside.id, 'Rahul Riverside');
});

describe('row level security', () => {
  it('shows a tenant only its own students', async () => {
    const seen = await withTenant(northwood.id, async (client) => {
      const { rows } = await client.query<{ full_name: string }>('SELECT full_name FROM student_records');
      return rows.map((r) => r.full_name);
    }, pool);

    expect(seen).toEqual(['Nadia Northwood']);
    expect(seen).not.toContain('Rahul Riverside');
  });

  it('hides a specific row of another tenant even when its id is known', async () => {
    const riversideStudentId = await withTenant(riverside.id, async (client) => {
      const { rows } = await client.query<{ id: string }>('SELECT id FROM student_records');
      return rows[0]!.id;
    }, pool);

    const found = await withTenant(northwood.id, async (client) => {
      const { rows } = await client.query('SELECT * FROM student_records WHERE id = $1', [
        riversideStudentId,
      ]);
      return rows;
    }, pool);

    expect(found).toEqual([]);
  });

  it('will not let a tenant update or delete another tenant’s row', async () => {
    const result = await withTenant(northwood.id, async (client) => {
      const updated = await client.query("UPDATE student_records SET full_name = 'Hijacked'");
      const deleted = await client.query('DELETE FROM student_records WHERE full_name = $1', [
        'Rahul Riverside',
      ]);
      return { updated: updated.rowCount, deleted: deleted.rowCount };
    }, pool);

    expect(result.updated).toBe(1); // only its own row
    expect(result.deleted).toBe(0);

    const riversideRows = await withTenant(riverside.id, async (client) => {
      const { rows } = await client.query<{ full_name: string }>('SELECT full_name FROM student_records');
      return rows.map((r) => r.full_name);
    }, pool);
    expect(riversideRows).toEqual(['Rahul Riverside']);
  });

  it('refuses to write a row stamped with another tenant id', async () => {
    await expect(
      withTenant(northwood.id, async (client) => {
        await client.query(
          'INSERT INTO student_records (tenant_id, full_name, class_label) VALUES ($1, $2, $3)',
          [riverside.id, 'Smuggled In', '9-B'],
        );
      }, pool),
    ).rejects.toThrow(/row-level security/i);
  });

  it('reads nothing at all when no tenant context is set — fails closed', async () => {
    const rows = await withoutTenant(async (client) => {
      const students = await client.query('SELECT * FROM student_records');
      const users = await client.query('SELECT * FROM users');
      return { students: students.rowCount, users: users.rowCount };
    }, pool);

    expect(rows).toEqual({ students: 0, users: 0 });
  });

  it('does not leak the tenant context back into the pool after a transaction', async () => {
    await withTenant(northwood.id, async (client) => {
      await client.query('SELECT 1');
    }, pool);

    // Same pool, no context: the next borrower must start blind.
    const leaked = await withoutTenant(async (client) => {
      const { rows } = await client.query<{ tenant: string | null }>(
        "SELECT current_setting('app.current_tenant', true) AS tenant",
      );
      return rows[0]!.tenant;
    }, pool);

    expect(leaked === null || leaked === '').toBe(true);
  });

  it('clears the tenant context even when the callback throws', async () => {
    await expect(
      withTenant(northwood.id, async () => {
        throw new Error('boom');
      }, pool),
    ).rejects.toThrow('boom');

    const stillIsolated = await withoutTenant(async (client) => {
      const { rowCount } = await client.query('SELECT * FROM student_records');
      return rowCount;
    }, pool);
    expect(stillIsolated).toBe(0);
  });

  it('rejects a tenant id that is not a uuid before it reaches SQL', async () => {
    await expect(
      withTenant("' OR '1'='1", async () => undefined, pool),
    ).rejects.toThrow(/non-uuid tenant id/);
  });
});

describe('user lookups across tenants', () => {
  it('cannot find another tenant’s user by id', async () => {
    const riversideAdminId = riverside.users.admin!.id;
    expect(await findUserById(riverside.id, riversideAdminId, pool)).not.toBeNull();
    expect(await findUserById(northwood.id, riversideAdminId, pool)).toBeNull();
  });

  it('lists only its own users', async () => {
    const emails = (await listUsers(northwood.id, pool)).map((u) => u.email).sort();
    expect(emails).toEqual([
      'admin@northwood.test',
      'parent@northwood.test',
      'shared@example.test',
      'teacher@northwood.test',
    ]);
    expect(emails).not.toContain('admin@riverside.test');
  });

  it('treats the same email in two schools as two separate people', async () => {
    const north = await findUserById(northwood.id, northwood.users.shared!.id, pool);
    const river = await findUserById(riverside.id, riverside.users.shared!.id, pool);

    expect(north!.id).not.toBe(river!.id);
    expect(north!.email).toBe(river!.email);
    expect(north!.roles).toEqual(['office']);
    expect(river!.roles).toEqual(['teacher']);
  });
});
