import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Config } from '../config.js';
import { isRole, type Role } from '../rbac/permissions.js';

export interface AccessTokenClaims {
  sub: string;
  tid: string;
  email: string;
  roles: Role[];
  jti: string;
  iat: number;
  exp: number;
}

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid or expired token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/**
 * Access tokens carry roles, not permissions. Permissions are resolved from the
 * matrix on every request, so a change to what a role may do takes effect at
 * once instead of when the last old token expires.
 */
export function signAccessToken(
  input: { userId: string; tenantId: string; email: string; roles: Role[] },
  config: Config,
): string {
  return jwt.sign(
    { tid: input.tenantId, email: input.email, roles: input.roles },
    config.jwtSecret,
    {
      subject: input.userId,
      jwtid: randomUUID(),
      expiresIn: config.accessTokenTtl,
      issuer: config.issuer,
      audience: config.audience,
      algorithm: 'HS256',
    },
  );
}

export function verifyAccessToken(token: string, config: Config): AccessTokenClaims {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ['HS256'], // pinned: without this a token could claim alg "none"
    });
  } catch (error) {
    throw new InvalidTokenError((error as Error).message);
  }

  const claims = decoded as Partial<AccessTokenClaims>;
  if (
    typeof claims?.sub !== 'string' ||
    typeof claims.tid !== 'string' ||
    typeof claims.email !== 'string' ||
    !Array.isArray(claims.roles) ||
    !claims.roles.every(isRole)
  ) {
    throw new InvalidTokenError('Token is missing required claims');
  }
  return claims as AccessTokenClaims;
}

/** Refresh tokens are opaque random strings; only their SHA-256 is stored. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(48).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
