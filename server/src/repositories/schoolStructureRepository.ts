import type { Pool } from 'pg';
import { withTenant } from '../db/tenantContext.js';

/**
 * Academic years, classes and sections — the structure a school configures
 * before any student is loaded (Jira LS-28's setup wizard).
 */

export interface AcademicYear {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  isCurrent: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Section {
  id: string;
  academicYearId: string;
  classId: string;
  className: string;
  name: string;
  capacity: number | null;
  classTeacher: { id: string; fullName: string } | null;
  enrolledCount: number;
}

/**
 * `SET a = $n, b = $n+1` for the fields a PATCH actually sent. Column names
 * come from the fixed map, never from the request. `undefined` means "not
 * sent"; `null` is a value, so a class teacher can be unassigned.
 */
function setClause(
  patch: Record<string, unknown>,
  columns: Record<string, string>,
  values: unknown[],
): string {
  const parts = ['updated_at = now()'];
  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] === undefined) continue;
    values.push(patch[key]);
    parts.push(`${column} = $${values.length}`);
  }
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Academic years
// ---------------------------------------------------------------------------

const YEAR_COLUMNS =
  'id, name, starts_on::text AS "startsOn", ends_on::text AS "endsOn", is_current AS "isCurrent"';

export async function listAcademicYears(tenantId: string, pool?: Pool): Promise<AcademicYear[]> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<AcademicYear>(
      `SELECT ${YEAR_COLUMNS} FROM academic_years ORDER BY starts_on DESC`,
    );
    return rows;
  }, pool);
}

export async function findAcademicYear(
  tenantId: string,
  id: string,
  pool?: Pool,
): Promise<AcademicYear | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<AcademicYear>(
      `SELECT ${YEAR_COLUMNS} FROM academic_years WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }, pool);
}

export async function findCurrentAcademicYear(
  tenantId: string,
  pool?: Pool,
): Promise<AcademicYear | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<AcademicYear>(
      `SELECT ${YEAR_COLUMNS} FROM academic_years WHERE is_current`,
    );
    return rows[0] ?? null;
  }, pool);
}

export async function createAcademicYear(
  tenantId: string,
  input: { name: string; startsOn: string; endsOn: string; makeCurrent?: boolean },
  pool?: Pool,
): Promise<AcademicYear> {
  return withTenant(tenantId, async (client) => {
    const { rowCount: hasCurrent } = await client.query('SELECT 1 FROM academic_years WHERE is_current');
    // A school with no current year is setting up the one it is about to use,
    // so that year becomes current without the caller having to ask.
    const makeCurrent = input.makeCurrent === true || !hasCurrent;
    if (makeCurrent && hasCurrent) {
      await client.query('UPDATE academic_years SET is_current = false, updated_at = now() WHERE is_current');
    }
    const { rows } = await client.query<AcademicYear>(
      `INSERT INTO academic_years (tenant_id, name, starts_on, ends_on, is_current)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${YEAR_COLUMNS}`,
      [tenantId, input.name, input.startsOn, input.endsOn, makeCurrent],
    );
    return rows[0]!;
  }, pool);
}

export async function updateAcademicYear(
  tenantId: string,
  id: string,
  patch: { name?: string; startsOn?: string; endsOn?: string },
  pool?: Pool,
): Promise<AcademicYear | null> {
  return withTenant(tenantId, async (client) => {
    const values: unknown[] = [];
    const set = setClause(patch, { name: 'name', startsOn: 'starts_on', endsOn: 'ends_on' }, values);
    values.push(id);
    const { rows } = await client.query<AcademicYear>(
      `UPDATE academic_years SET ${set} WHERE id = $${values.length} RETURNING ${YEAR_COLUMNS}`,
      values,
    );
    return rows[0] ?? null;
  }, pool);
}

export async function makeAcademicYearCurrent(
  tenantId: string,
  id: string,
  pool?: Pool,
): Promise<AcademicYear | null> {
  return withTenant(tenantId, async (client) => {
    const { rowCount } = await client.query('SELECT 1 FROM academic_years WHERE id = $1 FOR UPDATE', [id]);
    if (!rowCount) return null;
    // Two statements rather than one: the one-current index is checked row by
    // row, so flipping both rows in a single UPDATE can collide with itself.
    await client.query(
      'UPDATE academic_years SET is_current = false, updated_at = now() WHERE is_current AND id <> $1',
      [id],
    );
    const { rows } = await client.query<AcademicYear>(
      `UPDATE academic_years SET is_current = true, updated_at = now() WHERE id = $1
       RETURNING ${YEAR_COLUMNS}`,
      [id],
    );
    return rows[0]!;
  }, pool);
}

export async function deleteAcademicYear(tenantId: string, id: string, pool?: Pool): Promise<boolean> {
  return withTenant(tenantId, async (client) => {
    const { rowCount } = await client.query('DELETE FROM academic_years WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }, pool);
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

const CLASS_COLUMNS = 'id, name, display_order AS "displayOrder"';

export async function listClasses(tenantId: string, pool?: Pool): Promise<SchoolClass[]> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<SchoolClass>(
      `SELECT ${CLASS_COLUMNS} FROM classes ORDER BY display_order, lower(name)`,
    );
    return rows;
  }, pool);
}

/**
 * Creates several classes in one transaction: all of them, or none. A class
 * sent without a display order is placed after everything before it, so
 * "LKG, UKG, Class 1 … Class 12" typed in order stays in order.
 */
export async function createClasses(
  tenantId: string,
  inputs: ReadonlyArray<{ name: string; displayOrder?: number }>,
  pool?: Pool,
): Promise<SchoolClass[]> {
  return withTenant(tenantId, async (client) => {
    const { rows: [highest] } = await client.query<{ max: number }>(
      'SELECT COALESCE(max(display_order), 0)::int AS max FROM classes',
    );
    let last = highest!.max;
    const created: SchoolClass[] = [];
    for (const input of inputs) {
      const order = input.displayOrder ?? last + 1;
      last = Math.max(last, order);
      const { rows } = await client.query<SchoolClass>(
        `INSERT INTO classes (tenant_id, name, display_order) VALUES ($1, $2, $3)
         RETURNING ${CLASS_COLUMNS}`,
        [tenantId, input.name, order],
      );
      created.push(rows[0]!);
    }
    return created;
  }, pool);
}

export async function updateClass(
  tenantId: string,
  id: string,
  patch: { name?: string; displayOrder?: number },
  pool?: Pool,
): Promise<SchoolClass | null> {
  return withTenant(tenantId, async (client) => {
    const values: unknown[] = [];
    const set = setClause(patch, { name: 'name', displayOrder: 'display_order' }, values);
    values.push(id);
    const { rows } = await client.query<SchoolClass>(
      `UPDATE classes SET ${set} WHERE id = $${values.length} RETURNING ${CLASS_COLUMNS}`,
      values,
    );
    return rows[0] ?? null;
  }, pool);
}

export async function deleteClass(tenantId: string, id: string, pool?: Pool): Promise<boolean> {
  return withTenant(tenantId, async (client) => {
    const { rowCount } = await client.query('DELETE FROM classes WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }, pool);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

const SELECT_SECTION = `
  SELECT s.id, s.academic_year_id AS "academicYearId", s.class_id AS "classId",
         c.name AS "className", s.name, s.capacity,
         CASE WHEN t.id IS NULL THEN NULL
              ELSE json_build_object('id', t.id, 'fullName', t.full_name) END AS "classTeacher",
         (SELECT count(*)::int FROM enrollments e WHERE e.section_id = s.id) AS "enrolledCount"
    FROM sections s
    JOIN classes c ON c.id = s.class_id
    LEFT JOIN staff t ON t.id = s.class_teacher_id`;

const SECTION_ORDER = 'ORDER BY c.display_order, lower(c.name), lower(s.name)';

export async function listSections(
  tenantId: string,
  filter: { academicYearId: string; classId?: string },
  pool?: Pool,
): Promise<Section[]> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<Section>(
      `${SELECT_SECTION}
        WHERE s.academic_year_id = $1 AND ($2::uuid IS NULL OR s.class_id = $2)
        ${SECTION_ORDER}`,
      [filter.academicYearId, filter.classId ?? null],
    );
    return rows;
  }, pool);
}

export async function findSection(tenantId: string, id: string, pool?: Pool): Promise<Section | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<Section>(`${SELECT_SECTION} WHERE s.id = $1`, [id]);
    return rows[0] ?? null;
  }, pool);
}

/** All or none, like createClasses. */
export async function createSections(
  tenantId: string,
  inputs: ReadonlyArray<{
    academicYearId: string;
    classId: string;
    name: string;
    capacity?: number | null;
    classTeacherId?: string | null;
  }>,
  pool?: Pool,
): Promise<Section[]> {
  return withTenant(tenantId, async (client) => {
    const ids: string[] = [];
    for (const input of inputs) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO sections (tenant_id, academic_year_id, class_id, name, capacity, class_teacher_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          tenantId,
          input.academicYearId,
          input.classId,
          input.name,
          input.capacity ?? null,
          input.classTeacherId ?? null,
        ],
      );
      ids.push(rows[0]!.id);
    }
    const { rows } = await client.query<Section>(
      `${SELECT_SECTION} WHERE s.id = ANY($1::uuid[]) ${SECTION_ORDER}`,
      [ids],
    );
    return rows;
  }, pool);
}

export async function updateSection(
  tenantId: string,
  id: string,
  patch: { name?: string; capacity?: number | null; classTeacherId?: string | null },
  pool?: Pool,
): Promise<Section | null> {
  return withTenant(tenantId, async (client) => {
    const values: unknown[] = [];
    const set = setClause(
      patch,
      { name: 'name', capacity: 'capacity', classTeacherId: 'class_teacher_id' },
      values,
    );
    values.push(id);
    const { rowCount } = await client.query(
      `UPDATE sections SET ${set} WHERE id = $${values.length}`,
      values,
    );
    if (!rowCount) return null;
    const { rows } = await client.query<Section>(`${SELECT_SECTION} WHERE s.id = $1`, [id]);
    return rows[0]!;
  }, pool);
}

export async function deleteSection(tenantId: string, id: string, pool?: Pool): Promise<boolean> {
  return withTenant(tenantId, async (client) => {
    const { rowCount } = await client.query('DELETE FROM sections WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }, pool);
}

// ---------------------------------------------------------------------------
// Setup progress
// ---------------------------------------------------------------------------

export interface SetupCounts {
  classes: number;
  sections: number;
  classesWithoutSections: number;
  sectionsWithoutClassTeacher: number;
  teachingStaff: number;
  activeStudents: number;
}

export type SetupStepKey = 'academic_year' | 'classes' | 'sections' | 'class_teachers';

export interface SetupStep {
  key: SetupStepKey;
  done: boolean;
  required: boolean;
}

export interface SetupStatus {
  currentAcademicYear: AcademicYear | null;
  counts: SetupCounts;
  steps: SetupStep[];
  complete: boolean;
}

/**
 * What the setup wizard shows as done. Class teachers are reported but not
 * required: a school can start loading students before every section has a
 * teacher, and staff records arrive with the bulk import.
 */
export function setupSteps(hasCurrentYear: boolean, counts: SetupCounts): SetupStep[] {
  const sectionsDone = hasCurrentYear && counts.classes > 0 && counts.classesWithoutSections === 0;
  return [
    { key: 'academic_year', done: hasCurrentYear, required: true },
    { key: 'classes', done: counts.classes > 0, required: true },
    { key: 'sections', done: sectionsDone, required: true },
    {
      key: 'class_teachers',
      done: sectionsDone && counts.sectionsWithoutClassTeacher === 0,
      required: false,
    },
  ];
}

export async function getSetupStatus(tenantId: string, pool?: Pool): Promise<SetupStatus> {
  return withTenant(tenantId, async (client) => {
    const { rows: [current] } = await client.query<AcademicYear>(
      `SELECT ${YEAR_COLUMNS} FROM academic_years WHERE is_current`,
    );
    const { rows: [counts] } = await client.query<SetupCounts>(
      `SELECT
         (SELECT count(*)::int FROM classes) AS classes,
         (SELECT count(*)::int FROM sections WHERE academic_year_id = $1) AS sections,
         (SELECT count(*)::int FROM classes c
           WHERE NOT EXISTS (SELECT 1 FROM sections s
                              WHERE s.class_id = c.id AND s.academic_year_id = $1))
           AS "classesWithoutSections",
         (SELECT count(*)::int FROM sections
           WHERE academic_year_id = $1 AND class_teacher_id IS NULL)
           AS "sectionsWithoutClassTeacher",
         (SELECT count(*)::int FROM staff
           WHERE staff_type = 'teaching' AND status <> 'exited') AS "teachingStaff",
         (SELECT count(*)::int FROM students WHERE status = 'active') AS "activeStudents"`,
      [current?.id ?? null],
    );
    const steps = setupSteps(Boolean(current), counts!);
    return {
      currentAcademicYear: current ?? null,
      counts: counts!,
      steps,
      complete: steps.every((step) => step.done || !step.required),
    };
  }, pool);
}
