/**
 * Seeds one demo school with a user for every role, for local development and
 * for the SIS screens being built next.
 *
 *   npm run seed
 *
 * Safe to re-run: existing users are left alone, and the school structure is
 * only created if the school has no academic year yet. Refuses to run when
 * NODE_ENV=production.
 *
 * Runs on the admin connection (ADMIN_DATABASE_URL, falling back to
 * DATABASE_URL) because provisioning a tenant is an admin task — lumen_app has
 * read-only access to the tenants table.
 */
import { getPool, closePool } from '../src/db/pool.js';
import { hashPassword } from '../src/auth/password.js';
import {
  createAcademicYear,
  createClasses,
  createSections,
  findCurrentAcademicYear,
  updateSection,
} from '../src/repositories/schoolStructureRepository.js';
import { createStaff } from '../src/repositories/staffRepository.js';
import {
  createGuardian,
  createStudent,
  linkGuardian,
} from '../src/repositories/studentRepository.js';
import { createTenant, findTenantBySlug } from '../src/repositories/tenantRepository.js';
import { createUser, findUserByEmail } from '../src/repositories/userRepository.js';
import { ROLES, type Role } from '../src/rbac/permissions.js';
import type { Pool } from 'pg';

const SLUG = process.env.SEED_TENANT_SLUG ?? 'demo-school';
const PASSWORD = process.env.SEED_PASSWORD ?? 'demo-password-123';

/**
 * A school part-way through a normal year: classes LKG to 12, two sections
 * each, a handful of staff and students. The demo teacher, parent and student
 * logins are linked to records, so the ownership filter has something to show.
 */
async function seedSchoolStructure(tenantId: string, pool: Pool): Promise<void> {
  if (await findCurrentAcademicYear(tenantId, pool)) return;

  const year = await createAcademicYear(
    tenantId,
    { name: '2026-27', startsOn: '2026-04-01', endsOn: '2027-03-31' },
    pool,
  );
  const classes = await createClasses(
    tenantId,
    ['LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)].map((name) => ({ name })),
    pool,
  );

  const login = async (role: Role) => (await findUserByEmail(tenantId, `${role}@${SLUG}.test`, pool))?.id;

  const teacher = await createStaff(
    tenantId,
    {
      employeeNo: 'EMP-001',
      fullName: 'Demo teacher',
      designation: 'TGT Mathematics',
      userId: await login('teacher'),
    },
    pool,
  );
  await createStaff(tenantId, { employeeNo: 'EMP-002', fullName: 'Kavya Raman', designation: 'PGT Physics' }, pool);
  await createStaff(
    tenantId,
    { employeeNo: 'EMP-003', fullName: 'Demo office', staffType: 'non_teaching', userId: await login('office') },
    pool,
  );

  const sections = await createSections(
    tenantId,
    classes.flatMap((c) =>
      ['A', 'B'].map((name) => ({ academicYearId: year.id, classId: c.id, name, capacity: 40 })),
    ),
    pool,
  );
  const tenA = sections.find((s) => s.className === 'Class 10' && s.name === 'A')!;
  const tenB = sections.find((s) => s.className === 'Class 10' && s.name === 'B')!;
  await updateSection(tenantId, tenA.id, { classTeacherId: teacher.id }, pool);

  const priya = await createStudent(
    tenantId,
    { admissionNo: 'ADM-2026-001', fullName: 'Priya Sharma', gender: 'female', sectionId: tenA.id, rollNo: 1 },
    pool,
  );
  await createStudent(
    tenantId,
    {
      admissionNo: 'ADM-2026-002',
      fullName: 'Arjun Nair',
      gender: 'male',
      sectionId: tenA.id,
      rollNo: 2,
      userId: await login('student'),
    },
    pool,
  );
  await createStudent(
    tenantId,
    { admissionNo: 'ADM-2026-003', fullName: 'Fatima Khan', gender: 'female', sectionId: tenB.id, rollNo: 1 },
    pool,
  );

  const parent = await createGuardian(
    tenantId,
    { fullName: 'Demo parent', phone: '+91 90000 00000', userId: await login('parent') },
    pool,
  );
  await linkGuardian(tenantId, { studentId: priya.id, guardianId: parent.id, relationship: 'mother', isPrimary: true }, pool);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data in production');
  }

  const databaseUrl = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Set ADMIN_DATABASE_URL (or DATABASE_URL) to an admin connection');
  }
  const pool = getPool(databaseUrl);

  const tenant =
    (await findTenantBySlug(SLUG, pool)) ??
    (await createTenant(
      { slug: SLUG, name: 'Demo School', products: ['school', 'qpg', 'assessment'] },
      pool,
    ));

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of ROLES) {
    const email = `${role}@${SLUG}.test`;
    if (await findUserByEmail(tenant.id, email, pool)) continue;
    await createUser(
      {
        tenantId: tenant.id,
        email,
        fullName: `Demo ${role}`,
        passwordHash,
        roles: [role as Role],
      },
      pool,
    );
  }

  await seedSchoolStructure(tenant.id, pool);

  console.log(`Seeded tenant "${SLUG}" (${tenant.id}).`);
  console.log(`Sign in as <role>@${SLUG}.test with password "${PASSWORD}".`);
  await closePool();
}

await main();
