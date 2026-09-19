import type { Pool, PoolClient } from 'pg';
import { ReferenceNotFoundError } from '../db/referenceNotFound.js';
import { withTenant } from '../db/tenantContext.js';
import type { StudentScope } from '../rbac/authorize.js';

export type Gender = 'male' | 'female' | 'other';
export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'withdrawn';
export type Relationship = 'father' | 'mother' | 'guardian' | 'other';

export interface CurrentEnrollment {
  academicYearId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  rollNo: number | null;
}

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  admissionDate: string | null;
  status: StudentStatus;
  currentEnrollment: CurrentEnrollment | null;
}

export interface Guardian {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  userId: string | null;
}

const SELECT_STUDENT = `
  SELECT s.id, s.admission_no AS "admissionNo", s.full_name AS "fullName",
         s.date_of_birth::text AS "dateOfBirth", s.gender,
         s.admission_date::text AS "admissionDate", s.status,
         CASE WHEN e.id IS NULL THEN NULL ELSE json_build_object(
           'academicYearId', e.academic_year_id, 'sectionId', e.section_id,
           'className', c.name, 'sectionName', sec.name, 'rollNo', e.roll_no
         ) END AS "currentEnrollment"
    FROM students s
    LEFT JOIN academic_years y ON y.is_current
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = y.id
    LEFT JOIN sections sec ON sec.id = e.section_id
    LEFT JOIN classes c ON c.id = sec.class_id`;

/**
 * The ownership filter. A linked principal sees a student when the student
 * record is their own login, or when they are a guardian of that student.
 * Appends its parameter to `values` and returns the SQL condition.
 */
function scopeCondition(scope: StudentScope, values: unknown[]): string {
  if (scope.kind === 'all') return 'true';
  values.push(scope.userId);
  const me = `$${values.length}`;
  return `(s.user_id = ${me} OR EXISTS (
            SELECT 1 FROM student_guardians sg
              JOIN guardians g ON g.id = sg.guardian_id
             WHERE sg.student_id = s.id AND g.user_id = ${me}))`;
}

export async function listStudents(
  tenantId: string,
  scope: StudentScope,
  pool?: Pool,
): Promise<Student[]> {
  return withTenant(tenantId, async (client) => {
    const values: unknown[] = [];
    const visible = scopeCondition(scope, values);
    const { rows } = await client.query<Student>(
      `${SELECT_STUDENT} WHERE ${visible} ORDER BY lower(s.full_name), s.admission_no`,
      values,
    );
    return rows;
  }, pool);
}

export async function findStudent(
  tenantId: string,
  id: string,
  scope: StudentScope,
  pool?: Pool,
): Promise<Student | null> {
  return withTenant(tenantId, async (client) => {
    const values: unknown[] = [id];
    const visible = scopeCondition(scope, values);
    const { rows } = await client.query<Student>(
      `${SELECT_STUDENT} WHERE s.id = $1 AND ${visible}`,
      values,
    );
    return rows[0] ?? null;
  }, pool);
}

/**
 * The year comes from the section rather than the caller, so an enrollment
 * cannot name one year and a section from another. A section this tenant
 * cannot see inserts nothing, and that is reported as a missing reference.
 */
async function enroll(
  client: PoolClient,
  tenantId: string,
  studentId: string,
  sectionId: string,
  rollNo: number | null,
): Promise<void> {
  const { rowCount } = await client.query(
    `INSERT INTO enrollments (tenant_id, student_id, academic_year_id, section_id, roll_no)
     SELECT $1, $2, academic_year_id, id, $4 FROM sections WHERE id = $3`,
    [tenantId, studentId, sectionId, rollNo],
  );
  if (!rowCount) throw new ReferenceNotFoundError('section');
}

/** Creates the student and, when a section is given, enrolls them — both or neither. */
export async function createStudent(
  tenantId: string,
  input: {
    admissionNo: string;
    fullName: string;
    dateOfBirth?: string | null;
    gender?: Gender | null;
    admissionDate?: string | null;
    userId?: string | null;
    sectionId?: string;
    rollNo?: number | null;
  },
  pool?: Pool,
): Promise<Student> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO students (tenant_id, admission_no, full_name, date_of_birth, gender,
                             admission_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        tenantId,
        input.admissionNo.trim(),
        input.fullName.trim(),
        input.dateOfBirth ?? null,
        input.gender ?? null,
        input.admissionDate ?? null,
        input.userId ?? null,
      ],
    );
    const studentId = rows[0]!.id;
    if (input.sectionId) {
      await enroll(client, tenantId, studentId, input.sectionId, input.rollNo ?? null);
    }
    const { rows: created } = await client.query<Student>(`${SELECT_STUDENT} WHERE s.id = $1`, [
      studentId,
    ]);
    return created[0]!;
  }, pool);
}

export async function enrollStudent(
  tenantId: string,
  input: { studentId: string; sectionId: string; rollNo?: number | null },
  pool?: Pool,
): Promise<void> {
  await withTenant(tenantId, (client) =>
    enroll(client, tenantId, input.studentId, input.sectionId, input.rollNo ?? null), pool);
}

export async function createGuardian(
  tenantId: string,
  input: { fullName: string; phone?: string | null; email?: string | null; userId?: string | null },
  pool?: Pool,
): Promise<Guardian> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<Guardian>(
      `INSERT INTO guardians (tenant_id, full_name, phone, email, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name AS "fullName", phone, email, user_id AS "userId"`,
      [tenantId, input.fullName.trim(), input.phone ?? null, input.email ?? null, input.userId ?? null],
    );
    return rows[0]!;
  }, pool);
}

export async function linkGuardian(
  tenantId: string,
  input: { studentId: string; guardianId: string; relationship: Relationship; isPrimary?: boolean },
  pool?: Pool,
): Promise<void> {
  await withTenant(tenantId, async (client) => {
    await client.query(
      `INSERT INTO student_guardians (tenant_id, student_id, guardian_id, relationship, is_primary)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, input.studentId, input.guardianId, input.relationship, input.isPrimary ?? false],
    );
  }, pool);
}
