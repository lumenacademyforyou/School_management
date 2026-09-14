# Project log

One entry per working day. Newest first. Jira IDs in brackets.

---

## 14 Sep 2026 (Sun) — Sprint 1

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

### Known rough edges

- `.env` is not auto-loaded; no dotenv is wired. Use `node --env-file=.env`.
- No UI yet. This is an API — expect JSON and test output. First screens are
  [1028].

---

## Next up

| Date | Jira | Task |
| --- | --- | --- |
| 15 Sep | [1027] | SMS-SIS: Student, staff, class and academic-year data model + migrations |
| 16 Sep | [1028] | SMS-SIS: Class, section and academic-year setup screens |
| 17–18 Sep | [1029] | RND: Audit the NEET engine — reusable vs new |

[1027] freezes the core school schema — after the pilot starts, changes move to
Phase 2. Worth getting right rather than fast.
