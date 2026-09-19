/**
 * The ownership filter: inside a school, parents see their own children and
 * students see themselves. Row level security cannot express this — it only
 * knows the school — so these tests are what stop a parent login from reading
 * the whole school's student list.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import type { Express } from 'express';
import { hashPassword } from '../../src/auth/password.js';
import { createApp } from '../../src/http/app.js';
import {
  createGuardian,
  createStudent,
  linkGuardian,
} from '../../src/repositories/studentRepository.js';
import { createUser } from '../../src/repositories/userRepository.js';
import {
  TEST_PASSWORD,
  bearer,
  closeAdminPool,
  createTestPool,
  loginAs,
  resetData,
  seedSchoolStructure,
  seedTwoSchools,
  setupSchema,
  testConfig,
  type SeededStructure,
  type SeededTenant,
} from './harness.js';

let pool: Pool;
let app: Express;
let passwordHash: string;
let northwood: SeededTenant;
let riverside: SeededTenant;
let north: SeededStructure;
let river: SeededStructure;
const ids: Record<'asha' | 'bala' | 'chitra' | 'deepak', string> = {
  asha: '',
  bala: '',
  chitra: '',
  deepak: '',
};

beforeAll(async () => {
  await setupSchema();
  pool = createTestPool();
  app = createApp(testConfig, pool);
  passwordHash = await hashPassword(TEST_PASSWORD);
});

afterAll(async () => {
  await pool.end();
  await closeAdminPool();
});

beforeEach(async () => {
  await resetData();
  ({ northwood, riverside } = await seedTwoSchools(pool));
  north = await seedSchoolStructure(pool, northwood.id);
  river = await seedSchoolStructure(pool, riverside.id);

  const user = (email: string, role: 'student' | 'parent' | 'examiner') =>
    createUser({ tenantId: northwood.id, email, fullName: email, passwordHash, roles: [role] }, pool);
  const balaLogin = await user('bala@northwood.test', 'student');
  await user('parent2@northwood.test', 'parent');
  await user('examiner@northwood.test', 'examiner');

  const admit = async (admissionNo: string, fullName: string, extra = {}) =>
    (await createStudent(northwood.id, { admissionNo, fullName, ...extra }, pool)).id;
  ids.asha = await admit('N-1', 'Asha', { sectionId: north.sectionIds.tenA, rollNo: 1 });
  ids.bala = await admit('N-2', 'Bala', { sectionId: north.sectionIds.tenA, rollNo: 2, userId: balaLogin.id });
  ids.chitra = await admit('N-3', 'Chitra', { sectionId: north.sectionIds.nineA });
  ids.deepak = await admit('N-4', 'Deepak');
  await createStudent(riverside.id, { admissionNo: 'N-1', fullName: 'Rahul', sectionId: river.sectionIds.tenA }, pool);

  // The seeded Northwood parent is mother to two of the four: siblings.
  const mother = await createGuardian(
    northwood.id,
    { fullName: 'Northwood Parent', userId: northwood.users.parent!.id },
    pool,
  );
  await linkGuardian(northwood.id, { studentId: ids.asha, guardianId: mother.id, relationship: 'mother', isPrimary: true }, pool);
  await linkGuardian(northwood.id, { studentId: ids.chitra, guardianId: mother.id, relationship: 'mother' }, pool);
});

const names = (body: { students: Array<{ fullName: string }> }) => body.students.map((s) => s.fullName);

async function listAs(email: string) {
  const token = bearer(await loginAs(app, 'northwood', email));
  return request(app).get('/students').set(token);
}

describe('who sees which students', () => {
  it('shows staff the whole school and nothing beyond it', async () => {
    for (const email of ['admin@northwood.test', 'teacher@northwood.test', 'shared@example.test']) {
      const res = await listAs(email);
      expect(res.status, email).toBe(200);
      expect(names(res.body), email).toEqual(['Asha', 'Bala', 'Chitra', 'Deepak']);
    }
  });

  it('shows a parent only their own children', async () => {
    const parent = bearer(await loginAs(app, 'northwood', 'parent@northwood.test'));

    const list = await request(app).get('/students').set(parent).expect(200);
    expect(names(list.body)).toEqual(['Asha', 'Chitra']);

    const own = await request(app).get(`/students/${ids.asha}`).set(parent).expect(200);
    expect(own.body.currentEnrollment).toMatchObject({ className: 'Class 10', sectionName: 'A', rollNo: 1 });

    // A classmate at the same school is a 404, exactly like a student who does not exist.
    const classmate = await request(app).get(`/students/${ids.bala}`).set(parent);
    expect(classmate.status).toBe(404);
    expect(classmate.body.error.code).toBe('not_found');
  });

  it('shows a student only themselves', async () => {
    const student = bearer(await loginAs(app, 'northwood', 'bala@northwood.test'));
    expect(names((await request(app).get('/students').set(student).expect(200)).body)).toEqual(['Bala']);
    await request(app).get(`/students/${ids.asha}`).set(student).expect(404);
  });

  it('shows a parent with no linked children nobody', async () => {
    const res = await listAs('parent2@northwood.test');
    expect(res.status).toBe(200);
    expect(res.body.students).toEqual([]);
  });

  it('keeps student records away from external examiners', async () => {
    const res = await listAs('examiner@northwood.test');
    expect(res.status).toBe(403);
  });
});

describe('admitting a student', () => {
  it('enrolls into a section as part of admission', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const res = await request(app)
      .post('/students')
      .set(admin)
      .send({ admissionNo: 'N-5', fullName: 'Esha', gender: 'female', sectionId: north.sectionIds.tenB, rollNo: 5 })
      .expect(201);

    expect(res.body).toMatchObject({
      admissionNo: 'N-5',
      gender: 'female',
      status: 'active',
      currentEnrollment: { academicYearId: north.academicYearId, className: 'Class 10', sectionName: 'B', rollNo: 5 },
    });
  });

  it('refuses another school’s section and leaves no half-created student', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const res = await request(app)
      .post('/students')
      .set(admin)
      .send({ admissionNo: 'N-6', fullName: 'Farhan', sectionId: river.sectionIds.tenA });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('No such section');

    // The admission number is still free, so nothing was committed.
    await request(app).post('/students').set(admin).send({ admissionNo: 'N-6', fullName: 'Farhan' }).expect(201);
  });

  it('keeps admission numbers unique within the school, ignoring case', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const res = await request(app).post('/students').set(admin).send({ admissionNo: 'n-1', fullName: 'Copy' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('A student with this admission number already exists');
  });

  it('refuses a roll number already taken in the section', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const taken = await request(app)
      .post('/students')
      .set(admin)
      .send({ admissionNo: 'N-7', fullName: 'Gita', sectionId: north.sectionIds.tenA, rollNo: 1 });
    expect(taken.status).toBe(409);
    expect(taken.body.error.message).toBe('That roll number is already taken in this section');
  });

  it('rejects a roll number without a section', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const res = await request(app).post('/students').set(admin).send({ admissionNo: 'N-8', fullName: 'Hari', rollNo: 3 });
    expect(res.status).toBe(400);
  });
});
