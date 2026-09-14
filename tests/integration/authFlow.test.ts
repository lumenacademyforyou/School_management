import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import type { Express } from 'express';
import { createApp } from '../../src/http/app.js';
import {
  TEST_PASSWORD,
  closeAdminPool,
  createTestPool,
  resetData,
  seedTwoSchools,
  setupSchema,
  testConfig,
  type SeededTenant,
} from './harness.js';

let pool: Pool;
let app: Express;
let northwood: SeededTenant;
let riverside: SeededTenant;

beforeAll(async () => {
  await setupSchema();
  pool = createTestPool();
  app = createApp(testConfig, pool);
});

afterAll(async () => {
  await pool.end();
  await closeAdminPool();
});

beforeEach(async () => {
  await resetData();
  ({ northwood, riverside } = await seedTwoSchools(pool));
});

async function login(tenantSlug: string, email: string, password = TEST_PASSWORD) {
  return request(app).post('/auth/login').send({ tenantSlug, email, password });
}

describe('POST /auth/login', () => {
  it('issues a session scoped to the caller’s tenant', async () => {
    const res = await login('northwood', 'teacher@northwood.test');

    expect(res.status).toBe(200);
    expect(res.body.user.tenantId).toBe(northwood.id);
    expect(res.body.user.roles).toEqual(['teacher']);
    expect(res.body.user.permissions).toContain('attendance:mark');
    expect(res.body.user.permissions).not.toContain('fee:manage');
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('never returns the password hash', async () => {
    const res = await login('northwood', 'admin@northwood.test');
    expect(JSON.stringify(res.body)).not.toContain('scrypt$');
  });

  it('refuses a user from another school even with the right password', async () => {
    const res = await login('northwood', 'admin@riverside.test');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('gives the same answer for an unknown school as for a wrong password', async () => {
    const unknownSchool = await login('no-such-school', 'admin@northwood.test');
    const wrongPassword = await login('northwood', 'admin@northwood.test', 'wrong password here');

    expect(unknownSchool.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknownSchool.body).toEqual(wrongPassword.body);
  });

  it('resolves the same email to the right person per school', async () => {
    const atNorthwood = await login('northwood', 'shared@example.test');
    const atRiverside = await login('riverside', 'shared@example.test');

    expect(atNorthwood.body.user.roles).toEqual(['office']);
    expect(atRiverside.body.user.roles).toEqual(['teacher']);
    expect(atNorthwood.body.user.id).not.toBe(atRiverside.body.user.id);
  });

  it('rejects a malformed request with the shared error shape', async () => {
    const res = await request(app).post('/auth/login').send({ tenantSlug: 'northwood' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'bad_request' });
  });
});

describe('GET /auth/me', () => {
  it('returns the principal and its resolved permissions', async () => {
    const { body } = await login('northwood', 'parent@northwood.test');
    const res = await request(app).get('/auth/me').set('authorization', `Bearer ${body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(northwood.id);
    expect(res.body.permissions).toEqual(expect.arrayContaining(['result:read', 'fee:read']));
    expect(res.body.permissions).not.toContain('student:manage');
  });

  it('rejects a missing or malformed Authorization header', async () => {
    expect((await request(app).get('/auth/me')).status).toBe(401);
    expect((await request(app).get('/auth/me').set('authorization', 'Basic abc')).status).toBe(401);
    expect((await request(app).get('/auth/me').set('authorization', 'Bearer not.a.token')).status).toBe(401);
  });
});

describe('refresh and logout', () => {
  it('exchanges a refresh token for a new session', async () => {
    const first = await login('northwood', 'admin@northwood.test');
    const res = await request(app)
      .post('/auth/refresh')
      .send({ tenantSlug: 'northwood', refreshToken: first.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(first.body.user.id);
    expect(res.body.refreshToken).not.toBe(first.body.refreshToken);
  });

  it('burns the old refresh token on use', async () => {
    const first = await login('northwood', 'admin@northwood.test');
    await request(app)
      .post('/auth/refresh')
      .send({ tenantSlug: 'northwood', refreshToken: first.body.refreshToken });

    const replay = await request(app)
      .post('/auth/refresh')
      .send({ tenantSlug: 'northwood', refreshToken: first.body.refreshToken });

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('invalid_refresh_token');
  });

  it('will not accept a refresh token presented against another school', async () => {
    const north = await login('northwood', 'admin@northwood.test');
    const res = await request(app)
      .post('/auth/refresh')
      .send({ tenantSlug: 'riverside', refreshToken: north.body.refreshToken });

    expect(res.status).toBe(401);
  });

  it('revokes the refresh token on logout', async () => {
    const session = await login('northwood', 'admin@northwood.test');
    const out = await request(app)
      .post('/auth/logout')
      .set('authorization', `Bearer ${session.body.accessToken}`)
      .send({ refreshToken: session.body.refreshToken });
    expect(out.status).toBe(204);

    const after = await request(app)
      .post('/auth/refresh')
      .send({ tenantSlug: 'northwood', refreshToken: session.body.refreshToken });
    expect(after.status).toBe(401);
  });
});

describe('unknown endpoints', () => {
  it('uses the shared error shape for 404s', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('cross-tenant reads over HTTP', () => {
  it('serves each school only its own students', async () => {
    const northAdmin = await login('northwood', 'admin@northwood.test');
    const riverAdmin = await login('riverside', 'admin@riverside.test');

    await request(app)
      .post('/students')
      .set('authorization', `Bearer ${northAdmin.body.accessToken}`)
      .send({ fullName: 'Nadia Northwood', classLabel: '10-A' })
      .expect(201);

    const riverCreate = await request(app)
      .post('/students')
      .set('authorization', `Bearer ${riverAdmin.body.accessToken}`)
      .send({ fullName: 'Rahul Riverside', classLabel: '10-A' })
      .expect(201);

    const northList = await request(app)
      .get('/students')
      .set('authorization', `Bearer ${northAdmin.body.accessToken}`);

    expect(northList.body.students.map((s: { fullName: string }) => s.fullName)).toEqual([
      'Nadia Northwood',
    ]);

    // Northwood asking for a Riverside student by its real id gets a plain 404.
    const direct = await request(app)
      .get(`/students/${riverCreate.body.id}`)
      .set('authorization', `Bearer ${northAdmin.body.accessToken}`);
    expect(direct.status).toBe(404);
  });

  it('honours the tenant in the token, not any tenant the caller asks for', async () => {
    const northAdmin = await login('northwood', 'admin@northwood.test');

    // There is no way to name a tenant on these routes; a caller trying anyway
    // is served their own tenant's data, never another's.
    const res = await request(app)
      .get('/students')
      .query({ tenantId: riverside.id })
      .set('x-tenant-id', riverside.id)
      .set('authorization', `Bearer ${northAdmin.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toEqual([]);
  });
});

describe('RBAC over HTTP', () => {
  it('lets a teacher read students but not create them', async () => {
    const teacher = await login('northwood', 'teacher@northwood.test');
    const auth = `Bearer ${teacher.body.accessToken}`;

    await request(app).get('/students').set('authorization', auth).expect(200);

    const create = await request(app)
      .post('/students')
      .set('authorization', auth)
      .send({ fullName: 'Someone New', classLabel: '8-C' });

    expect(create.status).toBe(403);
    expect(create.body.error.code).toBe('forbidden');
    expect(create.body.error.message).toContain('student:manage');
  });

  it('lets office staff create students', async () => {
    const office = await login('northwood', 'shared@example.test');
    await request(app)
      .post('/students')
      .set('authorization', `Bearer ${office.body.accessToken}`)
      .send({ fullName: 'Admitted Today', classLabel: '6-B' })
      .expect(201);
  });

  it('does not let a parent create students', async () => {
    const parent = await login('northwood', 'parent@northwood.test');
    await request(app)
      .post('/students')
      .set('authorization', `Bearer ${parent.body.accessToken}`)
      .send({ fullName: 'Not Allowed', classLabel: '6-B' })
      .expect(403);
  });
});
