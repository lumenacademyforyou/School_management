import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { loadConfig, type Config } from '../../src/config.js';
import {
  InvalidTokenError,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../../src/auth/tokens.js';

const config: Config = loadConfig({
  DATABASE_URL: 'postgres://localhost/unused',
  JWT_SECRET: 'x'.repeat(48),
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  PORT: '3000',
} as NodeJS.ProcessEnv);

const subject = {
  userId: '11111111-1111-4111-8111-111111111111',
  tenantId: '22222222-2222-4222-8222-222222222222',
  email: 'teacher@school.test',
  roles: ['teacher'] as const,
};

describe('access tokens', () => {
  it('round-trips the identity, tenant and roles', () => {
    const claims = verifyAccessToken(signAccessToken({ ...subject, roles: ['teacher'] }, config), config);
    expect(claims.sub).toBe(subject.userId);
    expect(claims.tid).toBe(subject.tenantId);
    expect(claims.roles).toEqual(['teacher']);
  });

  it('does not put permissions in the token, only roles', () => {
    const decoded = jwt.decode(signAccessToken({ ...subject, roles: ['teacher'] }, config)) as Record<string, unknown>;
    expect(decoded).not.toHaveProperty('permissions');
    expect(decoded).toHaveProperty('roles');
  });

  it('rejects a token signed with a different secret', () => {
    const other = { ...config, jwtSecret: 'y'.repeat(48) };
    const token = signAccessToken({ ...subject, roles: ['teacher'] }, other);
    expect(() => verifyAccessToken(token, config)).toThrow(InvalidTokenError);
  });

  it('rejects a tampered payload', () => {
    const token = signAccessToken({ ...subject, roles: ['teacher'] }, config);
    const [header, payload, signature] = token.split('.') as [string, string, string];
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString());
    body.roles = ['admin'];
    const forged = [header, Buffer.from(JSON.stringify(body)).toString('base64url'), signature].join('.');
    expect(() => verifyAccessToken(forged, config)).toThrow(InvalidTokenError);
  });

  it('rejects an alg:none token', () => {
    const forged = jwt.sign({ tid: subject.tenantId, email: subject.email, roles: ['admin'] }, '', {
      algorithm: 'none',
      subject: subject.userId,
      issuer: config.issuer,
      audience: config.audience,
    });
    expect(() => verifyAccessToken(forged, config)).toThrow(InvalidTokenError);
  });

  it('rejects an expired token', () => {
    const token = signAccessToken({ ...subject, roles: ['teacher'] }, { ...config, accessTokenTtl: -1 });
    expect(() => verifyAccessToken(token, config)).toThrow(InvalidTokenError);
  });

  it('rejects a token issued for another audience', () => {
    const token = signAccessToken({ ...subject, roles: ['teacher'] }, { ...config, audience: 'someone-else' });
    expect(() => verifyAccessToken(token, config)).toThrow(InvalidTokenError);
  });

  it('rejects a token carrying an unknown role', () => {
    const token = jwt.sign({ tid: subject.tenantId, email: subject.email, roles: ['superuser'] }, config.jwtSecret, {
      subject: subject.userId,
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: 900,
    });
    expect(() => verifyAccessToken(token, config)).toThrow(/missing required claims/);
  });
});

describe('refresh tokens', () => {
  it('produces a fresh opaque token each time and a stable hash', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashRefreshToken(a.token));
    expect(a.hash).not.toBe(a.token);
  });
});

describe('config', () => {
  it('refuses a short signing secret', () => {
    expect(() =>
      loadConfig({ DATABASE_URL: 'postgres://x', JWT_SECRET: 'too-short' } as NodeJS.ProcessEnv),
    ).toThrow(/at least 32 characters/);
  });

  it('refuses a missing database url', () => {
    expect(() => loadConfig({ JWT_SECRET: 'x'.repeat(48) } as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });
});
