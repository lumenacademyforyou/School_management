/**
 * Jira LS-27: the SIS schema holds the tenant boundary on its own, whatever
 * the application layer does. Everything here talks to the database as
 * lumen_app, below the HTTP routes, because a route that forgets something is
 * exactly the case the schema has to survive.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import { ReferenceNotFoundError } from '../../src/db/referenceNotFound.js';
import { withTenant, withoutTenant } from '../../src/db/tenantContext.js';
import { deleteClass } from '../../src/repositories/schoolStructureRepository.js';
import { createStaff, findStaff } from '../../src/repositories/staffRepository.js';
import {
  createGuardian,
  createStudent,
  enrollStudent,
  linkGuardian,
} from '../../src/repositories/studentRepository.js';
import {
  closeAdminPool,
  createTestPool,
  getAdminPool,
  resetData,
  seedSchoolStructure,
  seedTwoSchools,
  setupSchema,
  type SeededStructure,
  type SeededTenant,
} from './harness.js';

const SIS_TABLES = [
  'academic_years',
  'classes',
  'staff',
  'sections',
  'students',
  'guardians',
  'student_guardians',
  'enrollments',
] as const;

let pool: Pool;
let northwood: SeededTenant;
let riverside: SeededTenant;
let north: SeededStructure;
let river: SeededStructure;
let northStudentId: string;
let northUnenrolledId: string;
let riverStudentId: string;
let northGuardianId: string;

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
  north = await seedSchoolStructure(pool, northwood.id);
  river = await seedSchoolStructure(pool, riverside.id);

  // A complete chain in each school, with identical admission numbers:
  // student, guardian, guardian link, enrollment.
  const seedChain = async (tenantId: string, structure: SeededStructure, name: string) => {
    const student = await createStudent(
      tenantId,
      { admissionNo: 'ADM-001', fullName: name, sectionId: structure.sectionIds.tenA, rollNo: 1 },
      pool,
    );
    const guardian = await createGuardian(tenantId, { fullName: `Parent of ${name}` }, pool);
    await linkGuardian(
      tenantId,
      { studentId: student.id, guardianId: guardian.id, relationship: 'mother', isPrimary: true },
      pool,
    );
    return { studentId: student.id, guardianId: guardian.id };
  };

  ({ studentId: northStudentId, guardianId: northGuardianId } = await seedChain(
    northwood.id,
    north,
    'Nadia',
  ));
  ({ studentId: riverStudentId } = await seedChain(riverside.id, river, 'Rahul'));

  northUnenrolledId = (
    await createStudent(northwood.id, { admissionNo: 'ADM-050', fullName: 'Unenrolled' }, pool)
  ).id;
});

const inTenant = (tenantId: string, sql: string, params: unknown[] = []) =>
  withTenant(tenantId, (client) => client.query(sql, params), pool);

describe('the tenant boundary on SIS tables', () => {
  it('puts every table with a tenant_id under a forced isolation policy', async () => {
    const { rows } = await pool.query<{
      table: string;
      enabled: boolean;
      forced: boolean;
      qual: string | null;
      with_check: string | null;
    }>(`
      SELECT c.relname AS table, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
             p.qual, p.with_check
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_policies p
          ON p.schemaname = n.nspname AND p.tablename = c.relname
         AND p.policyname = c.relname || '_tenant_isolation'
       WHERE n.nspname = 'public' AND c.relkind = 'r'
         AND EXISTS (SELECT 1 FROM pg_attribute a
                      WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped)`);

    expect(rows.map((r) => r.table)).toEqual(expect.arrayContaining([...SIS_TABLES]));
    for (const row of rows) {
      expect(row, row.table).toMatchObject({ enabled: true, forced: true });
      expect(row.qual, `${row.table} USING`).toContain('current_tenant_id()');
      expect(row.with_check, `${row.table} WITH CHECK`).toContain('current_tenant_id()');
    }
  });

  it.each(SIS_TABLES)('%s: a school reads only its own rows, and nothing without a context', async (table) => {
    const { rows } = await inTenant(northwood.id, `SELECT tenant_id FROM ${table}`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.tenant_id === northwood.id)).toBe(true);

    const blind = await withoutTenant((client) => client.query(`SELECT 1 FROM ${table}`), pool);
    expect(blind.rowCount).toBe(0);
  });
});

/**
 * Row level security checks the row being written, not the row it points at,
 * and foreign key checks ignore policies altogether. Each case runs the same
 * statement twice — once with this school's ids, which must work, and once
 * with the other school's, which must not — so a failure cannot come from a
 * typo in the SQL.
 */
describe('references cannot cross schools', () => {
  const cases: Array<{
    what: string;
    sql: string;
    params: (other: 'own' | 'foreign') => unknown[];
  }> = [
    {
      what: 'a section cannot use another school’s class',
      sql: `INSERT INTO sections (tenant_id, academic_year_id, class_id, name) VALUES ($1, $2, $3, 'Z')`,
      params: (o) => [northwood.id, north.academicYearId, o === 'own' ? north.classIds.nine : river.classIds.nine],
    },
    {
      what: 'a section cannot use another school’s academic year',
      sql: `INSERT INTO sections (tenant_id, academic_year_id, class_id, name) VALUES ($1, $2, $3, 'Z')`,
      params: (o) => [northwood.id, o === 'own' ? north.academicYearId : river.academicYearId, north.classIds.nine],
    },
    {
      what: 'a class teacher cannot be another school’s staff',
      sql: 'UPDATE sections SET class_teacher_id = $2 WHERE id = $1',
      params: (o) => [north.sectionIds.tenB, o === 'own' ? north.teacherStaffId : river.teacherStaffId],
    },
    {
      what: 'a student cannot be enrolled in another school’s section',
      sql: `INSERT INTO enrollments (tenant_id, student_id, academic_year_id, section_id)
            SELECT $1, $2, $3, $4`,
      params: (o) => [
        northwood.id,
        northUnenrolledId,
        o === 'own' ? north.academicYearId : river.academicYearId,
        o === 'own' ? north.sectionIds.tenB : river.sectionIds.tenB,
      ],
    },
    {
      what: 'a guardian cannot be linked to another school’s student',
      sql: `INSERT INTO student_guardians (tenant_id, student_id, guardian_id, relationship)
            VALUES ($1, $2, $3, 'father')`,
      params: (o) => [northwood.id, o === 'own' ? northUnenrolledId : riverStudentId, northGuardianId],
    },
    {
      what: 'a student record cannot take another school’s login',
      sql: 'UPDATE students SET user_id = $2 WHERE id = $1',
      params: (o) => [northStudentId, o === 'own' ? northwood.users.parent!.id : riverside.users.admin!.id],
    },
    {
      what: 'a staff record cannot take another school’s login',
      sql: 'UPDATE staff SET user_id = $2 WHERE id = $1',
      params: (o) => [north.teacherStaffId, o === 'own' ? northwood.users.teacher!.id : riverside.users.teacher!.id],
    },
    {
      what: 'a guardian cannot take another school’s login',
      sql: 'UPDATE guardians SET user_id = $2 WHERE id = $1',
      params: (o) => [northGuardianId, o === 'own' ? northwood.users.parent!.id : riverside.users.admin!.id],
    },
  ];

  it.each(cases)('$what', async ({ sql, params }) => {
    // The control is rolled back, so the foreign attempt meets the same data.
    await withTenant(northwood.id, async (client) => {
      await client.query('SAVEPOINT control');
      await client.query(sql, params('own'));
      await client.query('ROLLBACK TO SAVEPOINT control');
    }, pool);

    await expect(inTenant(northwood.id, sql, params('foreign'))).rejects.toMatchObject({ code: '23503' });
  });

  it('reports a section it cannot see as missing, and enrolls nobody', async () => {
    const student = await createStudent(northwood.id, { admissionNo: 'ADM-002', fullName: 'Nikhil' }, pool);

    await expect(
      enrollStudent(northwood.id, { studentId: student.id, sectionId: river.sectionIds.tenB }, pool),
    ).rejects.toBeInstanceOf(ReferenceNotFoundError);

    const { rowCount } = await inTenant(northwood.id, 'SELECT 1 FROM enrollments WHERE student_id = $1', [
      student.id,
    ]);
    expect(rowCount).toBe(0);
  });
});

describe('academic years', () => {
  const insertYear = `INSERT INTO academic_years (tenant_id, name, starts_on, ends_on, is_current)
                      VALUES ($1, $2, $3, $4, $5)`;

  it('cannot overlap inside one school', async () => {
    await expect(
      inTenant(northwood.id, insertYear, [northwood.id, 'Overlap', '2027-01-01', '2027-12-31', false]),
    ).rejects.toMatchObject({ code: '23P01', constraint: 'academic_years_no_overlap' });
  });

  it('may share names and dates with another school’s years', async () => {
    await inTenant(northwood.id, insertYear, [northwood.id, '2027-28', '2027-04-01', '2028-03-31', false]);
    await inTenant(riverside.id, insertYear, [riverside.id, '2027-28', '2027-04-01', '2028-03-31', false]);
  });

  it('allows only one current year per school', async () => {
    await expect(
      inTenant(northwood.id, insertYear, [northwood.id, '2027-28', '2027-04-01', '2028-03-31', true]),
    ).rejects.toMatchObject({ code: '23505', constraint: 'academic_years_one_current' });
  });

  it('must end after it starts', async () => {
    await expect(
      inTenant(northwood.id, insertYear, [northwood.id, 'Backwards', '2030-03-31', '2029-04-01', false]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});

describe('students and enrollments', () => {
  it('keeps admission numbers unique within a school, ignoring case', async () => {
    await expect(
      createStudent(northwood.id, { admissionNo: 'adm-001', fullName: 'Duplicate' }, pool),
    ).rejects.toMatchObject({ code: '23505', constraint: 'students_tenant_admission_no_key' });
  });

  it('puts a student in one section per academic year', async () => {
    await expect(
      enrollStudent(northwood.id, { studentId: northStudentId, sectionId: north.sectionIds.tenB }, pool),
    ).rejects.toMatchObject({ code: '23505', constraint: 'enrollments_student_year_key' });
  });

  it('keeps roll numbers unique within a section', async () => {
    const student = await createStudent(northwood.id, { admissionNo: 'ADM-002', fullName: 'Nikhil' }, pool);
    await expect(
      enrollStudent(northwood.id, { studentId: student.id, sectionId: north.sectionIds.tenA, rollNo: 1 }, pool),
    ).rejects.toMatchObject({ code: '23505', constraint: 'enrollments_section_roll_no_key' });
  });

  it('will not let an enrollment’s year disagree with its section’s year', async () => {
    const { rows } = await inTenant(
      northwood.id,
      `INSERT INTO academic_years (tenant_id, name, starts_on, ends_on)
       VALUES ($1, '2027-28', '2027-04-01', '2028-03-31') RETURNING id`,
      [northwood.id],
    );
    const nextYearId = rows[0]!.id as string;
    const student = await createStudent(northwood.id, { admissionNo: 'ADM-002', fullName: 'Nikhil' }, pool);

    await expect(
      inTenant(
        northwood.id,
        `INSERT INTO enrollments (tenant_id, student_id, academic_year_id, section_id)
         VALUES ($1, $2, $3, $4)`,
        [northwood.id, student.id, nextYearId, north.sectionIds.tenB],
      ),
    ).rejects.toMatchObject({ code: '23503', constraint: 'enrollments_section_fkey' });
  });
});

describe('deleting', () => {
  it('refuses to delete a class that still has sections', async () => {
    await expect(deleteClass(northwood.id, north.classIds.ten, pool)).rejects.toMatchObject({
      code: '23503',
    });
  });

  it('keeps the staff record when its login is removed', async () => {
    const member = await createStaff(
      northwood.id,
      { employeeNo: 'EMP-9', fullName: 'Leaving Login', userId: northwood.users.teacher!.id },
      pool,
    );
    await inTenant(northwood.id, 'DELETE FROM users WHERE id = $1', [northwood.users.teacher!.id]);

    expect(await findStaff(northwood.id, member.id, pool)).toMatchObject({
      fullName: 'Leaving Login',
      userId: null,
    });
  });

  it('can still remove a whole school in one statement', async () => {
    await getAdminPool().query('DELETE FROM tenants WHERE id = $1', [riverside.id]);

    for (const table of SIS_TABLES) {
      const { rowCount } = await getAdminPool().query(`SELECT 1 FROM ${table} WHERE tenant_id = $1`, [
        riverside.id,
      ]);
      expect(rowCount, table).toBe(0);
    }
    const { rows } = await inTenant(northwood.id, 'SELECT count(*)::int AS n FROM enrollments');
    expect(rows[0]!.n).toBe(1);
  });
});
