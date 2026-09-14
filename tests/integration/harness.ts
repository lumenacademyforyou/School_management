import { Pool } from 'pg';
import { loadConfig, type Config } from '../../src/config.js';
import { hashPassword } from '../../src/auth/password.js';
import { createTenant } from '../../src/repositories/tenantRepository.js';
import { createUser } from '../../src/repositories/userRepository.js';
import { migrate } from '../../scripts/migrate.js';
import type { Role } from '../../src/rbac/permissions.js';

/** Admin connection: runs migrations, provisions tenants, truncates between tests. */
export const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/lumen_platform_test';

const APP_ROLE_PASSWORD = process.env.TEST_APP_ROLE_PASSWORD ?? 'test-app-role';

/**
 * The connection the code under test uses: deliberately the unprivileged
 * lumen_app role. A superuser bypasses row level security outright, so running
 * these tests as an admin would make every isolation assertion pass for the
 * wrong reason.
 */
export const TEST_DATABASE_URL = (() => {
  const url = new URL(ADMIN_DATABASE_URL);
  url.username = 'lumen_app';
  url.password = APP_ROLE_PASSWORD;
  return url.toString();
})();

export const testConfig: Config = loadConfig({
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_SECRET: 'test-secret-that-is-comfortably-long-enough',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  PORT: '0',
} as NodeJS.ProcessEnv);

export function createTestPool(): Pool {
  return new Pool({ connectionString: TEST_DATABASE_URL, max: 5 });
}

let adminPool: Pool | undefined;

export function getAdminPool(): Pool {
  adminPool ??= new Pool({ connectionString: ADMIN_DATABASE_URL, max: 3 });
  return adminPool;
}

export async function closeAdminPool(): Promise<void> {
  await adminPool?.end();
  adminPool = undefined;
}

export async function setupSchema(): Promise<void> {
  await migrate(ADMIN_DATABASE_URL);
  // Migration 0002 leaves lumen_app unable to log in; deployment sets its
  // password from the secret store. The tests set a throwaway one.
  await getAdminPool().query(`ALTER ROLE lumen_app LOGIN PASSWORD '${APP_ROLE_PASSWORD}'`);
}

/**
 * Wipes every tenant-scoped table on the admin connection. TRUNCATE needs a
 * privilege lumen_app does not have, which is the point: the application
 * cannot empty a school's tables.
 */
export async function resetData(): Promise<void> {
  await getAdminPool().query(
    'TRUNCATE student_records, refresh_tokens, user_roles, users, tenants RESTART IDENTITY CASCADE',
  );
}

export interface SeededTenant {
  id: string;
  slug: string;
  users: Record<string, { id: string; email: string; password: string }>;
}

export const TEST_PASSWORD = 'correct horse battery staple';

/**
 * Two complete schools with the same-shaped data, which is what makes a leak
 * visible: if a query is missing its tenant context, the other school's rows
 * show up looking perfectly plausible.
 *
 * Tenants are provisioned on the admin connection — lumen_app has read-only
 * access to `tenants`, because creating a school is not something a product
 * route ever does.
 */
export async function seedTwoSchools(pool: Pool): Promise<{
  northwood: SeededTenant;
  riverside: SeededTenant;
}> {
  const passwordHash = await hashPassword(TEST_PASSWORD);

  const seedOne = async (slug: string, name: string, staff: Array<[string, string, Role[]]>) => {
    const tenant = await createTenant({ slug, name, products: ['school'] }, getAdminPool());
    const users: SeededTenant['users'] = {};
    for (const [key, email, roles] of staff) {
      const user = await createUser(
        { tenantId: tenant.id, email, fullName: `${key} at ${name}`, passwordHash, roles },
        pool,
      );
      users[key] = { id: user.id, email, password: TEST_PASSWORD };
    }
    return { id: tenant.id, slug: tenant.slug, users };
  };

  const northwood = await seedOne('northwood', 'Northwood High', [
    ['admin', 'admin@northwood.test', ['admin']],
    ['teacher', 'teacher@northwood.test', ['teacher']],
    ['parent', 'parent@northwood.test', ['parent']],
    // Deliberately the same address as a Riverside user: one email, two
    // schools, two different people.
    ['shared', 'shared@example.test', ['office']],
  ]);

  const riverside = await seedOne('riverside', 'Riverside Public School', [
    ['admin', 'admin@riverside.test', ['admin']],
    ['teacher', 'teacher@riverside.test', ['teacher']],
    ['shared', 'shared@example.test', ['teacher']],
  ]);

  return { northwood, riverside };
}

/** Inserts a student row under a given tenant, bypassing the HTTP layer. */
export async function seedStudent(
  pool: Pool,
  tenantId: string,
  fullName: string,
  classLabel = '10-A',
): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenantId]);
    const { rows } = await client.query<{ id: string }>(
      'INSERT INTO student_records (tenant_id, full_name, class_label) VALUES ($1, $2, $3) RETURNING id',
      [tenantId, fullName, classLabel],
    );
    await client.query('COMMIT');
    return rows[0]!.id;
  } finally {
    client.release();
  }
}
