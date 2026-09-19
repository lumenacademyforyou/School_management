import type { Pool, PoolClient } from 'pg';
import { withTenant } from '../db/tenantContext.js';
import type { Role } from '../rbac/permissions.js';

export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  status: 'active' | 'disabled';
  roles: Role[];
}

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  status: 'active' | 'disabled';
  password_hash: string;
  roles: Role[] | null;
}

const SELECT_USER = `
  SELECT u.id, u.tenant_id, u.email, u.full_name, u.status, u.password_hash,
         COALESCE(array_agg(r.role ORDER BY r.role)
                  FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles r ON r.user_id = u.id
`;

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    fullName: row.full_name,
    status: row.status,
    roles: row.roles ?? [],
  };
}

/**
 * Both lookups run inside withTenant, so a user id from tenant A simply is not
 * found when the caller's context is tenant B — the "not found" is the database
 * policy talking, not an application check that could be forgotten.
 */
export async function findUserByEmail(
  tenantId: string,
  email: string,
  pool?: Pool,
): Promise<(UserRecord & { passwordHash: string }) | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<UserRow>(
      `${SELECT_USER} WHERE lower(u.email) = lower($1) GROUP BY u.id`,
      [email.trim()],
    );
    const row = rows[0];
    return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
  }, pool);
}

export async function findUserById(
  tenantId: string,
  userId: string,
  pool?: Pool,
): Promise<UserRecord | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<UserRow>(
      `${SELECT_USER} WHERE u.id = $1 GROUP BY u.id`,
      [userId],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }, pool);
}

export async function listUsers(tenantId: string, pool?: Pool): Promise<UserRecord[]> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<UserRow>(`${SELECT_USER} GROUP BY u.id ORDER BY u.email`);
    return rows.map(toUser);
  }, pool);
}

export async function createUser(
  input: {
    tenantId: string;
    email: string;
    fullName: string;
    passwordHash: string;
    roles: Role[];
  },
  pool?: Pool,
): Promise<UserRecord> {
  return withTenant(input.tenantId, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (tenant_id, email, full_name, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [input.tenantId, input.email.trim(), input.fullName, input.passwordHash],
    );
    const userId = rows[0]!.id;
    await grantRoles(client, input.tenantId, userId, input.roles);
    return {
      id: userId,
      tenantId: input.tenantId,
      email: input.email.trim(),
      fullName: input.fullName,
      status: 'active',
      roles: [...input.roles].sort(),
    };
  }, pool);
}

async function grantRoles(
  client: PoolClient,
  tenantId: string,
  userId: string,
  roles: Role[],
): Promise<void> {
  if (roles.length === 0) return;
  await client.query(
    `INSERT INTO user_roles (user_id, tenant_id, role)
     SELECT $1, $2, unnest($3::text[])
     ON CONFLICT (user_id, role) DO NOTHING`,
    [userId, tenantId, roles],
  );
}

export async function recordLogin(tenantId: string, userId: string, pool?: Pool): Promise<void> {
  await withTenant(tenantId, async (client) => {
    await client.query('UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1', [
      userId,
    ]);
  }, pool);
}
