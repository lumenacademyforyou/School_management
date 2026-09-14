import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import type { Config } from '../config.js';
import { withTenant } from '../db/tenantContext.js';
import { findTenantBySlug } from '../repositories/tenantRepository.js';
import { findUserByEmail, findUserById, recordLogin } from '../repositories/userRepository.js';
import { permissionsForRoles, type Permission, type Role } from '../rbac/permissions.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from './tokens.js';
import { hashPassword, verifyPassword } from './password.js';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
    readonly code = 'invalid_credentials',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    tenantId: string;
    tenantSlug: string;
    email: string;
    fullName: string;
    roles: Role[];
    permissions: Permission[];
  };
}

/**
 * Login is scoped by tenant slug: the same email address can belong to a parent
 * at one school and a teacher at another, and those are two different people as
 * far as the platform is concerned.
 */
export async function login(
  input: { tenantSlug: string; email: string; password: string },
  config: Config,
  pool?: Pool,
): Promise<Session> {
  const tenant = await findTenantBySlug(input.tenantSlug, pool);
  if (!tenant || tenant.status !== 'active') {
    // Same message as a bad password: whether a school exists on the platform
    // is not something an anonymous caller gets to probe.
    throw new AuthError('Email or password is incorrect');
  }

  const user = await findUserByEmail(tenant.id, input.email, pool);
  // Verify against a dummy hash when the user is missing so that a bad email
  // and a bad password take the same amount of time.
  const passwordOk = await verifyPassword(
    input.password,
    user?.passwordHash ?? (await getDummyHash()),
  );
  if (!user || !passwordOk) {
    throw new AuthError('Email or password is incorrect');
  }
  if (user.status !== 'active') {
    throw new AuthError('This account has been disabled', 403, 'account_disabled');
  }

  await recordLogin(tenant.id, user.id, pool);

  return issueSession(
    { ...user, tenantSlug: tenant.slug },
    config,
    pool,
  );
}

/** Exchanges a refresh token for a new session and revokes the one presented. */
export async function refresh(
  input: { tenantSlug: string; refreshToken: string },
  config: Config,
  pool?: Pool,
): Promise<Session> {
  const tenant = await findTenantBySlug(input.tenantSlug, pool);
  if (!tenant || tenant.status !== 'active') {
    throw new AuthError('Refresh token is not valid', 401, 'invalid_refresh_token');
  }

  const userId = await withTenant(tenant.id, async (client) => {
    const { rows } = await client.query<{ id: string; user_id: string }>(
      `UPDATE refresh_tokens
          SET revoked_at = now()
        WHERE token_hash = $1
          AND revoked_at IS NULL
          AND expires_at > now()
        RETURNING id, user_id`,
      [hashRefreshToken(input.refreshToken)],
    );
    return rows[0]?.user_id ?? null;
  }, pool);

  if (!userId) throw new AuthError('Refresh token is not valid', 401, 'invalid_refresh_token');

  const user = await findUserById(tenant.id, userId, pool);
  if (!user || user.status !== 'active') {
    throw new AuthError('This account has been disabled', 403, 'account_disabled');
  }

  return issueSession({ ...user, tenantSlug: tenant.slug }, config, pool);
}

/** Revokes a single refresh token. Idempotent: logging out twice is not an error. */
export async function logout(
  input: { tenantId: string; refreshToken: string },
  pool?: Pool,
): Promise<void> {
  await withTenant(input.tenantId, async (client) => {
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashRefreshToken(input.refreshToken)],
    );
  }, pool);
}

async function issueSession(
  user: {
    id: string;
    tenantId: string;
    tenantSlug: string;
    email: string;
    fullName: string;
    roles: Role[];
  },
  config: Config,
  pool?: Pool,
): Promise<Session> {
  const { token: refreshToken, hash } = generateRefreshToken();

  await withTenant(user.tenantId, async (client) => {
    await client.query(
      `INSERT INTO refresh_tokens (tenant_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(secs => $4))`,
      [user.tenantId, user.id, hash, config.refreshTokenTtl],
    );
  }, pool);

  return {
    accessToken: signAccessToken(
      { userId: user.id, tenantId: user.tenantId, email: user.email, roles: user.roles },
      config,
    ),
    refreshToken,
    expiresIn: config.accessTokenTtl,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      permissions: permissionsForRoles(user.roles),
    },
  };
}

/**
 * A hash of a random value nobody holds. Verifying against it when the email is
 * unknown keeps a bad email and a bad password indistinguishable by timing, so
 * the login endpoint cannot be used to enumerate who has an account.
 */
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString('base64url'));
  return dummyHash;
}
