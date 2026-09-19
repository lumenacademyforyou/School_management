-- 0004_sis_core.sql
-- Core School MMS schema (Jira LS-27): academic years, classes, sections,
-- staff, students, guardians and enrollments.
--
-- This schema freezes once the pilot starts. What the freeze protects is the
-- shape — keys, relationships, and the constraints that keep bad data out.
-- Adding a nullable column later (blood group, address, …) is invisible to
-- anything downstream; changing what a student is enrolled in is not.
--
-- Two rules run through every table below.
--
-- 1. The tenant boundary from 0001: tenant_id plus the isolation policy.
--
-- 2. Every reference between tenant-scoped tables is a composite foreign key on
--    (tenant_id, id). Foreign key checks run without row level security, and
--    the policy only inspects the row being written — not the row it points
--    at. A plain `class_id REFERENCES classes (id)` would therefore let one
--    school attach a section to another school's class, given the uuid. With
--    the tenant inside the key, the referenced row must belong to the same
--    school or the write fails.
--
-- Parent-side foreign keys use the default NO ACTION rather than RESTRICT.
-- Both block deleting a class that still has sections, but RESTRICT is checked
-- mid-statement, which would also block deleting a whole tenant: the cascade
-- could reach academic_years before it reaches the sections that reference
-- them.

-- The overlap constraint on academic years compares a uuid with `=` inside a
-- GiST index, which needs btree_gist.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Lets staff, students and guardians point at a login in the same tenant only.
ALTER TABLE users ADD CONSTRAINT users_tenant_id_id_key UNIQUE (tenant_id, id);

-- ---------------------------------------------------------------------------
-- Academic years
-- ---------------------------------------------------------------------------
-- Everything that changes year to year (sections, class teachers, enrollments)
-- hangs off one of these. Exactly one may be current; years may not overlap, so
-- "which year is this date in" always has a single answer.
CREATE TABLE academic_years (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  starts_on   date NOT NULL,
  ends_on     date NOT NULL,
  is_current  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_years_dates_check CHECK (ends_on > starts_on),
  CONSTRAINT academic_years_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT academic_years_no_overlap EXCLUDE USING gist (
    tenant_id WITH =,
    daterange(starts_on, ends_on, '[]') WITH &&
  )
);

CREATE UNIQUE INDEX academic_years_tenant_name_key
  ON academic_years (tenant_id, lower(name));
CREATE UNIQUE INDEX academic_years_one_current
  ON academic_years (tenant_id) WHERE is_current;

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
-- A class is a grade level — LKG, Class 1, Class 12 — and outlives any single
-- year. display_order exists because names do not sort: "Class 10" comes
-- before "Class 2" alphabetically, and LKG before both.
CREATE TABLE classes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  name           text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  display_order  integer NOT NULL DEFAULT 0 CHECK (display_order BETWEEN 0 AND 1000),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT classes_tenant_id_id_key UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX classes_tenant_name_key ON classes (tenant_id, lower(name));

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
-- The employment record. user_id is the optional login: not every member of
-- staff signs in, and a login can be revoked without losing the record.
CREATE TABLE staff (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  employee_no      text NOT NULL CHECK (length(btrim(employee_no)) BETWEEN 1 AND 40),
  full_name        text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  email            text CHECK (email IS NULL OR position('@' in email) > 1),
  phone            text,
  staff_type       text NOT NULL DEFAULT 'teaching'
                   CHECK (staff_type IN ('teaching', 'non_teaching')),
  designation      text,
  date_of_joining  date,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'on_leave', 'exited')),
  user_id          uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT staff_user_fkey FOREIGN KEY (tenant_id, user_id)
    REFERENCES users (tenant_id, id) ON DELETE SET NULL (user_id)
);

CREATE UNIQUE INDEX staff_tenant_employee_no_key ON staff (tenant_id, lower(employee_no));
CREATE UNIQUE INDEX staff_user_key ON staff (user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Sections
-- ---------------------------------------------------------------------------
-- 10-A in 2026-27 and 10-A in 2027-28 are different sections: different
-- children, often a different class teacher. Keying sections by year keeps
-- last year's rosters intact when this year's are built.
CREATE TABLE sections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  academic_year_id  uuid NOT NULL,
  class_id          uuid NOT NULL,
  name              text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 20),
  capacity          integer CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 500),
  class_teacher_id  uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_tenant_id_id_key UNIQUE (tenant_id, id),
  -- Target of the enrollments foreign key that pins an enrollment's year to
  -- its section's year.
  CONSTRAINT sections_tenant_id_id_year_key UNIQUE (tenant_id, id, academic_year_id),
  CONSTRAINT sections_academic_year_fkey FOREIGN KEY (tenant_id, academic_year_id)
    REFERENCES academic_years (tenant_id, id),
  CONSTRAINT sections_class_fkey FOREIGN KEY (tenant_id, class_id)
    REFERENCES classes (tenant_id, id),
  CONSTRAINT sections_class_teacher_fkey FOREIGN KEY (tenant_id, class_teacher_id)
    REFERENCES staff (tenant_id, id) ON DELETE SET NULL (class_teacher_id)
);

CREATE UNIQUE INDEX sections_year_class_name_key
  ON sections (academic_year_id, class_id, lower(name));
CREATE INDEX sections_tenant_idx ON sections (tenant_id);
CREATE INDEX sections_class_idx ON sections (class_id);
CREATE INDEX sections_class_teacher_idx ON sections (class_teacher_id);

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
-- The admission record. Which class a student is in is not stored here — it
-- is a fact about a year, and lives in enrollments.
--
-- No Aadhaar column, deliberately: it is sensitive personal data under DPDP,
-- nothing in the MVP needs it, and a column that exists gets filled.
CREATE TABLE students (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  admission_no    text NOT NULL CHECK (length(btrim(admission_no)) BETWEEN 1 AND 40),
  full_name       text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  date_of_birth   date,
  gender          text CHECK (gender IN ('male', 'female', 'other')),
  admission_date  date,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'graduated', 'transferred', 'withdrawn')),
  user_id         uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT students_user_fkey FOREIGN KEY (tenant_id, user_id)
    REFERENCES users (tenant_id, id) ON DELETE SET NULL (user_id)
);

CREATE UNIQUE INDEX students_tenant_admission_no_key
  ON students (tenant_id, lower(admission_no));
CREATE UNIQUE INDEX students_user_key ON students (user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Guardians
-- ---------------------------------------------------------------------------
-- A guardian is a person, not a column on the student: siblings share parents,
-- and one parent login should see all of their children. The link table is
-- what the parent ownership filter reads.
CREATE TABLE guardians (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  full_name   text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  phone       text,
  email       text CHECK (email IS NULL OR position('@' in email) > 1),
  user_id     uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guardians_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT guardians_user_fkey FOREIGN KEY (tenant_id, user_id)
    REFERENCES users (tenant_id, id) ON DELETE SET NULL (user_id)
);

CREATE INDEX guardians_tenant_idx ON guardians (tenant_id);
CREATE UNIQUE INDEX guardians_user_key ON guardians (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE student_guardians (
  tenant_id     uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  student_id    uuid NOT NULL,
  guardian_id   uuid NOT NULL,
  relationship  text NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, guardian_id),
  CONSTRAINT student_guardians_student_fkey FOREIGN KEY (tenant_id, student_id)
    REFERENCES students (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT student_guardians_guardian_fkey FOREIGN KEY (tenant_id, guardian_id)
    REFERENCES guardians (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX student_guardians_tenant_idx ON student_guardians (tenant_id);
CREATE INDEX student_guardians_guardian_idx ON student_guardians (guardian_id);
-- The contact the school calls first. At most one per student.
CREATE UNIQUE INDEX student_guardians_one_primary
  ON student_guardians (student_id) WHERE is_primary;

-- ---------------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------------
-- A student's place in a section for one academic year. academic_year_id looks
-- redundant next to section_id, but it is what makes "one section per student
-- per year" a unique constraint, and the three-column foreign key stops it
-- from ever disagreeing with the section's own year.
CREATE TABLE enrollments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  student_id        uuid NOT NULL,
  academic_year_id  uuid NOT NULL,
  section_id        uuid NOT NULL,
  roll_no           integer CHECK (roll_no IS NULL OR roll_no BETWEEN 1 AND 10000),
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'promoted', 'detained', 'left')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_student_fkey FOREIGN KEY (tenant_id, student_id)
    REFERENCES students (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT enrollments_section_fkey FOREIGN KEY (tenant_id, section_id, academic_year_id)
    REFERENCES sections (tenant_id, id, academic_year_id),
  CONSTRAINT enrollments_student_year_key UNIQUE (student_id, academic_year_id)
);

CREATE INDEX enrollments_tenant_year_idx ON enrollments (tenant_id, academic_year_id);
CREATE INDEX enrollments_section_idx ON enrollments (section_id);
CREATE UNIQUE INDEX enrollments_section_roll_no_key
  ON enrollments (section_id, roll_no) WHERE roll_no IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Tenant boundary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'academic_years', 'classes', 'staff', 'sections',
    'students', 'guardians', 'student_guardians', 'enrollments'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) '
      'WITH CHECK (tenant_id = current_tenant_id())',
      t || '_tenant_isolation', t);
  END LOOP;
END $$;

-- 0002's default privileges cover these already. Granting explicitly as well
-- means a migration run by a different admin role cannot leave the app unable
-- to read its own tables.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON academic_years, classes, staff, sections,
     students, guardians, student_guardians, enrollments
  TO lumen_app;

-- ---------------------------------------------------------------------------
-- Retire the placeholder
-- ---------------------------------------------------------------------------
-- student_records was the foundation's worked example, standing in until this
-- schema existed. students replaces it.
DROP TABLE IF EXISTS student_records;
