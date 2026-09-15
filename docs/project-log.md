# Project log

One entry per working day. Newest first. Jira IDs in brackets.

---

## 15 Sep 2026 (Tue) — Sprint 1

Checked for blockers first: neither ticket depends on anyone else's work.
The LS-28 *screens* are the exception — see "Not done, deliberately".

### Done — [1027 / LS-27] SMS-SIS: Student, staff, class and academic-year data model ✅

`migrations/0004_sis_core.sql`, with the design written up in
`docs/sis-data-model.md`.

- **Eight tables:** `academic_years`, `classes`, `sections` (per year),
  `staff`, `students`, `guardians`, `student_guardians`, `enrollments`. Class
  membership is an enrollment per year, not a column on the student, so
  history survives promotion.
- **Composite `(tenant_id, id)` foreign keys everywhere.** Row level security
  checks the row being written, not the row it references, and foreign key
  checks skip policies. Without this, one school could attach a section to
  another school's class given its uuid. There is a test for each reference, run
  against a control using this school's own ids.
- **Constraints that keep bad data out:** academic years cannot overlap and only
  one is current; admission and employee numbers are unique per school,
  case-insensitive; one section per student per year; roll numbers unique per
  section; an enrollment's year must match its section's.
- **Ownership filter.** New `student:read_own` for parent and student, so a
  parent login lists only their own children and a student only themselves.
  Before this, parents held `student:read` and would have seen the whole school
  once real data existed.
- Retired the `student_records` placeholder; `/students` now runs on the real
  schema.

### Done — [1028 / LS-28] SMS-SIS: Class, section and academic-year setup (API) ✅

- `GET /setup/status` drives the wizard: steps done, plus the counts behind
  them.
- Endpoints for academic years (create, rename, make current, delete), classes
  and sections, with **bulk** variants: "LKG to Class 12" and "A and B for every
  class" are one request each, all-or-nothing.
- Deletes refuse with 409 while something depends on the row (sections on a
  class, students in a section).
- Constraint violations come back as the shared error shape with a readable
  message — `409 conflict` / `400 bad_request` — never the driver's text.
- `npm run seed` now builds a set-up demo school, so `/demo` and
  `requests.http` show the wizard status and the parent filter.

**148 tests pass** (was 73). Verified the ownership filter by removing it: 3
tests fail.

### Not done, deliberately

- **The setup screens.** LS-28 is labelled backend. The screens should be built
  from the shared component library, which is **LS-31 (design system, Prince)**
  — due 15 Sep and still To Do. Building React screens before it lands means
  building them twice. The API is ready for them.
- **Staff/student update, delete and spreadsheet import** — LS-38 (23 Sep).
  Only read-only `GET /staff` exists, for choosing class teachers.
- **Subjects** — with timetable and exams (LS-49). **Aadhaar** — not stored; see
  the design notes.
- **Deployed to staging / QA sign-off** — still no staging or CI ([1020], JD1).
- **The migration has not been run against Supabase.** Run `npm run migrate`
  when ready; it drops the `student_records` placeholder.

### Rough edges found

- The local PostgreSQL 17 install listens on **5433**, not 5432, so the
  integration tests could not connect until `TEST_ADMIN_DATABASE_URL` pointed
  there. `npm test` does not read `.env`.

---

## 14 Sep 2026 (Mon) — Sprint 1

### Done — [1026] FND: Extend shared auth, RBAC and tenant model  ✅

*Acceptance criterion: a user in one tenant cannot read another tenant's data.*

The repo was empty apart from a placeholder, so the "existing common base" the
ticket refers to did not exist here and was built from scratch.

- **Tenant boundary** — `tenant_id` on every scoped table, enforced by
  PostgreSQL row level security rather than application code.
  `withTenant()` pins a transaction to one tenant with `SET LOCAL`. Fails
  closed: no tenant context means an empty result, never another school's rows.
- **`lumen_app` role + `assertRlsEnforced()`** — superusers bypass RLS
  silently, so the app runs as an unprivileged role and refuses to start if
  that is ever misconfigured. *(Found the hard way: the first test run passed
  every isolation check for the wrong reason, because it connected as
  `postgres`.)*
- **Auth** — tenant-scoped login, scrypt at the OWASP baseline, HS256 access
  tokens with the algorithm pinned, single-use refresh tokens stored as
  SHA-256 only. Login does not leak whether an account exists.
- **RBAC** — six roles across all three products; routes gate on permissions,
  tokens carry only roles so matrix changes take effect immediately.
- Shared error contract, migration runner, dev seed script, lint/typecheck/test
  setup, design notes in `docs/auth-rbac-tenancy.md`.

**73 tests pass**, including integration tests against real PostgreSQL proving
the isolation criterion.

Merged to `CSK-branch` via PR #1.

### Also done — environment survey

Surveyed both Supabase projects and wrote `docs/environments.md` and
`docs/integration-map.md`. Headline finding: **the existing assessment engine
has no tenant concept at all** — no `tenant_id` / `school_id` / `org_id` column
anywhere. That is the main integration cost, and it belongs in [1029]'s sizing.

### Not done, deliberately

- **CI pipeline** — [1020] is JD1's task. When it lands, the test job needs a
  Postgres service and `TEST_ADMIN_DATABASE_URL`, or the integration tests
  silently do not run.
- **Audit logging / request id** — [1030], SD2's gateway task.
- **Ownership filter** (a parent sees only *their* child) — belongs with the
  SIS data model, [1027]. Today's matrix is the outer gate only.

### Safety guard added

The test suite TRUNCATEs every tenant-scoped table between files. Pointed at a
hosted database that would destroy real data, so `setupSchema()` and
`resetData()` now refuse any non-local host unless `ALLOW_DESTRUCTIVE_TESTS=1`
is set. **Never run `npm test` against a live Supabase project.**

### Demo page

`GET /demo` runs eight checks against the live API in a browser and shows each
one passing — useful for standup, for a Jira attachment, and for spotting a
broken environment at a glance. Not served in production.

### Known rough edges

- ~~`.env` is not auto-loaded~~ — fixed 14 Sep: every script now reads `.env`,
  so no shell-specific env syntax is needed on Windows or anywhere else.
- No UI yet. This is an API — expect JSON and test output. First screens are
  [1028].

---

## Next up

| Date | Jira | Task |
| --- | --- | --- |
| 16 Sep | [1028 / LS-28] | Screens, once LS-31's component library lands |
| 17–18 Sep | [1029 / LS-29] | RND: Audit the NEET engine — reusable vs new |
| 23 Sep | [1038 / LS-38] | SMS-SIS: Student and staff CRUD APIs + bulk import from spreadsheet |
| 24 Sep | [1039 / LS-39] | SMS-FEE: Fee heads, fee structure and assignment API |
| 25 Sep | [1040 / LS-40] | SMS-ATT: Parent absence notification trigger |

The schema from [1027] is now what the pilot freezes. LS-38's import is the
first thing that will stress it with real spreadsheets.
