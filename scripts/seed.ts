/**
 * Seeds one demo school with a user for every role, for local development and
 * for the SIS screens being built next.
 *
 *   npm run seed
 *
 * Safe to re-run: existing users are left alone. Refuses to run when
 * NODE_ENV=production.
 *
 * Runs on the admin connection (ADMIN_DATABASE_URL, falling back to
 * DATABASE_URL) because provisioning a tenant is an admin task — lumen_app has
 * read-only access to the tenants table.
 */
import { getPool, closePool } from '../src/db/pool.js';
import { hashPassword } from '../src/auth/password.js';
import { createTenant, findTenantBySlug } from '../src/repositories/tenantRepository.js';
import { createUser, findUserByEmail } from '../src/repositories/userRepository.js';
import { ROLES, type Role } from '../src/rbac/permissions.js';

const SLUG = process.env.SEED_TENANT_SLUG ?? 'demo-school';
const PASSWORD = process.env.SEED_PASSWORD ?? 'demo-password-123';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data in production');
  }

  const databaseUrl = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Set ADMIN_DATABASE_URL (or DATABASE_URL) to an admin connection');
  }
  const pool = getPool(databaseUrl);

  const tenant =
    (await findTenantBySlug(SLUG, pool)) ??
    (await createTenant(
      { slug: SLUG, name: 'Demo School', products: ['school', 'qpg', 'assessment'] },
      pool,
    ));

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of ROLES) {
    const email = `${role}@${SLUG}.test`;
    if (await findUserByEmail(tenant.id, email, pool)) continue;
    await createUser(
      {
        tenantId: tenant.id,
        email,
        fullName: `Demo ${role}`,
        passwordHash,
        roles: [role as Role],
      },
      pool,
    );
  }

  console.log(`Seeded tenant "${SLUG}" (${tenant.id}).`);
  console.log(`Sign in as <role>@${SLUG}.test with password "${PASSWORD}".`);
  await closePool();
}

await main();
