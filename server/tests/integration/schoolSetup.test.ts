/**
 * Jira LS-28: the setup API behind the school setup wizard — academic years,
 * classes, sections and class teachers, over HTTP as a real admin would use it.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import type { Express } from 'express';
import { createApp } from '../../src/http/app.js';
import { listClasses } from '../../src/repositories/schoolStructureRepository.js';
import { createStaff } from '../../src/repositories/staffRepository.js';
import {
  bearer,
  closeAdminPool,
  createTestPool,
  loginAs,
  resetData,
  seedSchoolStructure,
  seedTwoSchools,
  setupSchema,
  testConfig,
  type SeededTenant,
} from './harness.js';

let pool: Pool;
let app: Express;
let northwood: SeededTenant;

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
  ({ northwood } = await seedTwoSchools(pool));
});

const steps = (status: { steps: Array<{ key: string; done: boolean }> }) =>
  Object.fromEntries(status.steps.map((s) => [s.key, s.done]));

const YEAR_2026 = { name: '2026-27', startsOn: '2026-04-01', endsOn: '2027-03-31' };
const YEAR_2027 = { name: '2027-28', startsOn: '2027-04-01', endsOn: '2028-03-31' };

describe('the setup wizard', () => {
  it('takes a new school from nothing to ready', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));

    const empty = await request(app).get('/setup/status').set(admin).expect(200);
    expect(empty.body.complete).toBe(false);
    expect(empty.body.currentAcademicYear).toBeNull();

    // The school's first year becomes current without being asked.
    const year = await request(app).post('/academic-years').set(admin).send(YEAR_2026).expect(201);
    expect(year.body).toMatchObject({ ...YEAR_2026, isCurrent: true });

    const classes = await request(app)
      .post('/classes/bulk')
      .set(admin)
      .send({ classes: [{ name: 'LKG' }, { name: 'Class 1' }, { name: 'Class 2' }] })
      .expect(201);
    expect(classes.body.classes.map((c: { displayOrder: number }) => c.displayOrder)).toEqual([1, 2, 3]);

    const midway = await request(app).get('/setup/status').set(admin);
    expect(steps(midway.body)).toEqual({
      academic_year: true,
      classes: true,
      sections: false,
      class_teachers: false,
    });

    const sections = await request(app)
      .post('/sections/bulk')
      .set(admin)
      .send({
        academicYearId: year.body.id,
        classIds: classes.body.classes.map((c: { id: string }) => c.id),
        names: ['A', 'B'],
        capacity: 40,
      })
      .expect(201);
    expect(sections.body.sections).toHaveLength(6);

    // Class teachers are optional: the school is ready to load students now.
    const ready = await request(app).get('/setup/status').set(admin);
    expect(ready.body.complete).toBe(true);
    expect(steps(ready.body).class_teachers).toBe(false);

    const teacher = await createStaff(northwood.id, { employeeNo: 'T-1', fullName: 'Meera Iyer' }, pool);
    for (const section of sections.body.sections as Array<{ id: string }>) {
      await request(app).patch(`/sections/${section.id}`).set(admin).send({ classTeacherId: teacher.id }).expect(200);
    }

    const done = await request(app).get('/setup/status').set(admin);
    expect(steps(done.body)).toEqual({
      academic_year: true,
      classes: true,
      sections: true,
      class_teachers: true,
    });
    expect(done.body.counts).toMatchObject({
      classes: 3,
      sections: 6,
      classesWithoutSections: 0,
      sectionsWithoutClassTeacher: 0,
      teachingStaff: 1,
    });

    const listed = await request(app).get('/sections').set(admin).expect(200);
    expect(listed.body.academicYearId).toBe(year.body.id);
    expect(listed.body.sections.map((s: { className: string; name: string }) => `${s.className}-${s.name}`))
      .toEqual(['LKG-A', 'LKG-B', 'Class 1-A', 'Class 1-B', 'Class 2-A', 'Class 2-B']);
    expect(listed.body.sections[0]).toMatchObject({
      capacity: 40,
      classTeacher: { id: teacher.id, fullName: 'Meera Iyer' },
      enrolledCount: 0,
    });
  });

  it('switches the current year and keeps exactly one', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const first = await request(app).post('/academic-years').set(admin).send(YEAR_2026).expect(201);
    const second = await request(app).post('/academic-years').set(admin).send(YEAR_2027).expect(201);
    expect(second.body.isCurrent).toBe(false);

    await request(app).post(`/academic-years/${second.body.id}/make-current`).set(admin).expect(200);

    const { body } = await request(app).get('/academic-years').set(admin).expect(200);
    const current = body.academicYears.filter((y: { isCurrent: boolean }) => y.isCurrent);
    expect(current.map((y: { id: string }) => y.id)).toEqual([second.body.id]);
    expect(body.academicYears.map((y: { id: string }) => y.id)).toContain(first.body.id);
  });

  it('refuses years that overlap or run backwards', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    await request(app).post('/academic-years').set(admin).send(YEAR_2026).expect(201);

    const overlap = await request(app)
      .post('/academic-years')
      .set(admin)
      .send({ name: 'Overlap', startsOn: '2027-01-01', endsOn: '2027-12-31' });
    expect(overlap.status).toBe(409);
    expect(overlap.body.error.code).toBe('conflict');

    const backwards = await request(app)
      .post('/academic-years')
      .set(admin)
      .send({ name: 'Backwards', startsOn: '2030-03-31', endsOn: '2029-04-01' });
    expect(backwards.status).toBe(400);
    expect(backwards.body.error.code).toBe('bad_request');
  });

  it('creates none of a bulk list when one entry is a duplicate', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    await request(app).post('/classes').set(admin).send({ name: 'Class 1' }).expect(201);

    const res = await request(app)
      .post('/classes/bulk')
      .set(admin)
      .send({ classes: [{ name: 'Class 2' }, { name: 'class 1' }] });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already exists/);

    const { body } = await request(app).get('/classes').set(admin);
    expect(body.classes.map((c: { name: string }) => c.name)).toEqual(['Class 1']);
  });

  it('refuses a second section with the same name in a class and year', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const s = await seedSchoolStructure(pool, northwood.id);

    const res = await request(app)
      .post('/sections')
      .set(admin)
      .send({ academicYearId: s.academicYearId, classId: s.classIds.ten, name: 'a' });
    expect(res.status).toBe(409);
  });

  it('will not delete structure that is still in use', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const s = await seedSchoolStructure(pool, northwood.id);

    expect((await request(app).delete(`/classes/${s.classIds.ten}`).set(admin)).status).toBe(409);
    expect((await request(app).delete(`/academic-years/${s.academicYearId}`).set(admin)).status).toBe(409);

    await request(app)
      .post('/students')
      .set(admin)
      .send({ admissionNo: 'ADM-1', fullName: 'Enrolled', sectionId: s.sectionIds.tenB })
      .expect(201);
    const enrolled = await request(app).delete(`/sections/${s.sectionIds.tenB}`).set(admin);
    expect(enrolled.status).toBe(409);
    expect(enrolled.body.error.code).toBe('conflict');

    await request(app).delete(`/sections/${s.sectionIds.nineA}`).set(admin).expect(204);
  });

  it('accepts only current teaching staff as class teachers', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const s = await seedSchoolStructure(pool, northwood.id);

    const res = await request(app)
      .patch(`/sections/${s.sectionIds.tenB}`)
      .set(admin)
      .send({ classTeacherId: s.officeStaffId });
    expect(res.status).toBe(400);

    const unassign = await request(app)
      .patch(`/sections/${s.sectionIds.tenA}`)
      .set(admin)
      .send({ classTeacherId: null })
      .expect(200);
    expect(unassign.body.classTeacher).toBeNull();
  });

  it('answers a malformed id with 404, not a server error', async () => {
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const res = await request(app).patch('/classes/not-a-uuid').set(admin).send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('who may configure a school', () => {
  it('lets a teacher read the structure but not change it', async () => {
    const teacher = bearer(await loginAs(app, 'northwood', 'teacher@northwood.test'));

    await request(app).get('/classes').set(teacher).expect(200);
    await request(app).get('/setup/status').set(teacher).expect(200);

    const create = await request(app).post('/classes').set(teacher).send({ name: 'Class 11' });
    expect(create.status).toBe(403);
    expect(create.body.error.message).toContain('class:manage');
    await request(app).post('/academic-years').set(teacher).send(YEAR_2026).expect(403);
  });

  it('lets office staff read sections but not create them', async () => {
    const office = bearer(await loginAs(app, 'northwood', 'shared@example.test'));
    await request(app).get('/sections').set(office).expect(200);
    await request(app)
      .post('/sections/bulk')
      .set(office)
      .send({ academicYearId: crypto.randomUUID(), classIds: [crypto.randomUUID()], names: ['A'] })
      .expect(403);
  });

  it('keeps parents out of school configuration entirely', async () => {
    const parent = bearer(await loginAs(app, 'northwood', 'parent@northwood.test'));
    await request(app).get('/classes').set(parent).expect(403);
    await request(app).get('/setup/status').set(parent).expect(403);
  });

  it('shows the staff list to admins but not to teachers', async () => {
    await seedSchoolStructure(pool, northwood.id);
    const admin = bearer(await loginAs(app, 'northwood', 'admin@northwood.test'));
    const teacher = bearer(await loginAs(app, 'northwood', 'teacher@northwood.test'));

    const all = await request(app).get('/staff').set(admin).expect(200);
    expect(all.body.staff.map((m: { fullName: string }) => m.fullName)).toEqual(['Meera Teacher', 'Omar Office']);
    const teaching = await request(app).get('/staff?staffType=teaching').set(admin).expect(200);
    expect(teaching.body.staff).toHaveLength(1);

    await request(app).get('/staff').set(teacher).expect(403);
  });

  it('requires a token', async () => {
    await request(app).get('/setup/status').expect(401);
    await request(app).post('/classes').send({ name: 'X' }).expect(401);
  });
});

describe('setup across schools', () => {
  it('never lets one school see or change another school’s structure', async () => {
    const north = await seedSchoolStructure(pool, northwood.id);
    const riverAdmin = bearer(await loginAs(app, 'riverside', 'admin@riverside.test'));

    expect((await request(app).get('/classes').set(riverAdmin)).body.classes).toEqual([]);
    expect((await request(app).get(`/sections/${north.sectionIds.tenA}`).set(riverAdmin)).status).toBe(404);
    expect(
      (await request(app).patch(`/sections/${north.sectionIds.tenA}`).set(riverAdmin).send({ name: 'Z' })).status,
    ).toBe(404);
    expect((await request(app).delete(`/classes/${north.classIds.nine}`).set(riverAdmin)).status).toBe(404);
    expect(
      (await request(app).post(`/academic-years/${north.academicYearId}/make-current`).set(riverAdmin)).status,
    ).toBe(404);

    const byYear = await request(app)
      .get(`/sections?academicYearId=${north.academicYearId}`)
      .set(riverAdmin)
      .expect(200);
    expect(byYear.body.sections).toEqual([]);

    expect((await listClasses(northwood.id, pool)).map((c) => c.name)).toEqual(['Class 9', 'Class 10']);
  });

  it('refuses to build on another school’s ids', async () => {
    const north = await seedSchoolStructure(pool, northwood.id);
    const riverAdmin = bearer(await loginAs(app, 'riverside', 'admin@riverside.test'));
    const year = await request(app).post('/academic-years').set(riverAdmin).send(YEAR_2026).expect(201);
    const [riverClass] = (
      await request(app).post('/classes/bulk').set(riverAdmin).send({ classes: [{ name: 'Class 10' }] })
    ).body.classes;

    const foreignClass = await request(app)
      .post('/sections')
      .set(riverAdmin)
      .send({ academicYearId: year.body.id, classId: north.classIds.ten, name: 'C' });
    expect(foreignClass.status).toBe(400);
    expect(foreignClass.body.error.message).toBe('No such class');

    const foreignTeacher = await request(app)
      .post('/sections')
      .set(riverAdmin)
      .send({ academicYearId: year.body.id, classId: riverClass.id, name: 'C', classTeacherId: north.teacherStaffId });
    expect(foreignTeacher.status).toBe(400);

    const foreignYear = await request(app)
      .post('/sections/bulk')
      .set(riverAdmin)
      .send({ academicYearId: north.academicYearId, classIds: [riverClass.id], names: ['C'] });
    expect(foreignYear.status).toBe(400);
    expect(foreignYear.body.error.message).toBe('No such academic year');
  });
});
