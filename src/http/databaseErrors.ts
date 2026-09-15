import { ReferenceNotFoundError } from '../db/referenceNotFound.js';
import { HttpError, badRequest, conflict } from './errors.js';

interface PgError extends Error {
  code: string;
  constraint?: string;
}

/** SQLSTATE codes are five characters; Node's own error codes (ECONNREFUSED…) are not. */
function isPgError(error: unknown): error is PgError {
  return (
    error instanceof Error &&
    typeof (error as Partial<PgError>).code === 'string' &&
    /^[0-9A-Z]{5}$/.test((error as PgError).code)
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return isPgError(error) && error.code === '23503';
}

/**
 * The schema's constraints are the real validation — they hold under
 * concurrency and for every writer, not just this API. This turns a violation
 * into something a school administrator can act on.
 *
 * Every message is a fixed string. A driver message can quote values and SQL,
 * and a foreign key failure reads the same whether the row is missing or
 * belongs to another school, which is what keeps it from confirming that an id
 * exists elsewhere.
 */
const BY_CONSTRAINT: Readonly<Record<string, () => HttpError>> = {
  academic_years_tenant_name_key: () => conflict('An academic year with this name already exists'),
  academic_years_no_overlap: () =>
    conflict('Academic years cannot overlap, and these dates fall inside an existing year'),
  academic_years_one_current: () =>
    conflict('Another academic year was made current at the same moment; try again'),
  academic_years_dates_check: () => badRequest('An academic year must end after it starts'),
  classes_tenant_name_key: () => conflict('A class with this name already exists'),
  sections_year_class_name_key: () =>
    conflict('This class already has a section with that name in this academic year'),
  sections_academic_year_fkey: () => badRequest('No such academic year'),
  sections_class_fkey: () => badRequest('No such class'),
  sections_class_teacher_fkey: () => badRequest('No such member of staff'),
  staff_tenant_employee_no_key: () =>
    conflict('A member of staff with this employee number already exists'),
  students_tenant_admission_no_key: () =>
    conflict('A student with this admission number already exists'),
  enrollments_section_fkey: () => badRequest('No such section'),
  enrollments_student_year_key: () =>
    conflict('This student is already enrolled for that academic year'),
  enrollments_section_roll_no_key: () =>
    conflict('That roll number is already taken in this section'),
};

export function fromDatabaseError(error: unknown): HttpError | undefined {
  if (error instanceof ReferenceNotFoundError) return badRequest(`No such ${error.what}`);
  if (!isPgError(error)) return undefined;

  const known = error.constraint ? BY_CONSTRAINT[error.constraint] : undefined;
  if (known) return known();

  switch (error.code) {
    case '23505':
      return conflict('That record already exists');
    case '23P01':
      return conflict('That overlaps an existing record');
    case '23503':
      return badRequest('That refers to a record that does not exist');
    case '23514':
      return badRequest('A value is outside its allowed range');
    case '22P02':
    case '22007':
    case '22008':
      return badRequest('A value is malformed');
    default:
      return undefined;
  }
}
