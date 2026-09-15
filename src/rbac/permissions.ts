/**
 * The permission vocabulary shared by School MMS, the Question Paper Generator
 * and Assessment.
 *
 * Permissions are `<resource>:<action>` strings. Routes ask for a permission,
 * never for a role — that way a role gaining or losing an ability is a change
 * in one table below and nothing else moves.
 */
export const PERMISSIONS = [
  // Platform
  'tenant:read',
  'tenant:manage',
  'user:read',
  'user:manage',
  'audit:read',

  // School MMS
  'student:read', // every student in the school
  'student:read_own', // only students linked to the caller: their children, or themselves
  'student:manage',
  'staff:read',
  'staff:manage',
  'class:read',
  'class:manage',
  'attendance:read',
  'attendance:mark',
  'fee:read',
  'fee:manage',

  // Question Paper Generator
  'question:read',
  'question:author',
  'paper:generate',
  'paper:approve',

  // Assessment
  'exam:read',
  'exam:attempt',
  'exam:evaluate',
  'result:read',
  'result:publish',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  'admin',
  'teacher',
  'office',
  'parent',
  'student',
  'examiner',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Role to permission matrix.
 *
 * Read this as the product rules in one place:
 *  - admin    — the school's own administrator; everything inside their tenant.
 *  - teacher  — teaches classes: marks attendance, authors questions, evaluates.
 *  - office   — front office: admissions, records and fees, no teaching surface.
 *  - parent   — sees their child's attendance, fees and results, writes nothing.
 *  - student  — sees their own record and results, attempts exams.
 *  - examiner — external paper setter/evaluator; question bank and evaluation
 *               only, no access to student personal records.
 *
 * `parent` and `student` hold `student:read_own` rather than `student:read`:
 * the student routes then narrow them to linked rows (see `studentScope`). The
 * matrix decides which of the two a role gets; the query does the narrowing.
 */
const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = Object.freeze({
  admin: [
    'tenant:read', 'tenant:manage',
    'user:read', 'user:manage',
    'audit:read',
    'student:read', 'student:manage',
    'staff:read', 'staff:manage',
    'class:read', 'class:manage',
    'attendance:read', 'attendance:mark',
    'fee:read', 'fee:manage',
    'question:read', 'question:author',
    'paper:generate', 'paper:approve',
    'exam:read', 'exam:evaluate',
    'result:read', 'result:publish',
  ],
  teacher: [
    'student:read',
    'class:read',
    'attendance:read', 'attendance:mark',
    'question:read', 'question:author',
    'paper:generate',
    'exam:read', 'exam:evaluate',
    'result:read',
  ],
  office: [
    'student:read', 'student:manage',
    'staff:read',
    'class:read',
    'attendance:read',
    'fee:read', 'fee:manage',
    'user:read',
  ],
  parent: [
    'student:read_own',
    'attendance:read',
    'fee:read',
    'result:read',
  ],
  student: [
    'student:read_own',
    'attendance:read',
    'exam:read', 'exam:attempt',
    'result:read',
  ],
  examiner: [
    'question:read', 'question:author',
    'paper:generate', 'paper:approve',
    'exam:read', 'exam:evaluate',
  ],
});

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/** Union of the permissions granted by every role a user holds. */
export function permissionsForRoles(roles: readonly Role[]): Permission[] {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) granted.add(permission);
  }
  return [...granted].sort();
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
