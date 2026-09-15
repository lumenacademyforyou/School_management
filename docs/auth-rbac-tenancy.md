# Auth, RBAC and the tenant model

Design notes for the shared foundation. The acceptance criterion this was built
against: **a user in one tenant cannot read another tenant's data.**

## 1. The tenant boundary

A tenant is one customer — a school, a publisher, an assessment body. Every
tenant-scoped table carries `tenant_id`, and the boundary is enforced in
PostgreSQL rather than in application code:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE  ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users
  USING       (tenant_id = current_tenant_id())
  WITH CHECK  (tenant_id = current_tenant_id());
```

`current_tenant_id()` reads the session variable `app.current_tenant`.
`withTenant(tenantId, fn)` opens a transaction, sets it with `SET LOCAL`, and
runs the callback:

```ts
await withTenant(principal.tenantId, (client) =>
  client.query('SELECT * FROM students'),
);
```

Three properties fall out of doing it this way:

- **It fails closed.** With no context set, `current_setting(..., true)` is
  NULL, `tenant_id = NULL` is NULL rather than true, and the query returns
  nothing. Forgetting the tenant context yields an empty result, never someone
  else's rows.
- **It cannot leak between requests.** `SET LOCAL` is scoped to the
  transaction, so a connection returning to the pool carries no context.
- **A missed `WHERE tenant_id = ...` is not a breach.** The policy is applied
  by the database to every statement, including `UPDATE` and `DELETE`, and
  `WITH CHECK` blocks writing a row stamped with someone else's tenant.

What the policy does *not* check is the row a foreign key points at. So
references between tenant-scoped tables are composite keys on
`(tenant_id, id)`; see [`sis-data-model.md`](sis-data-model.md).

### The one way to lose it

Superusers and `BYPASSRLS` roles ignore policies entirely — silently. So:

- migrations run as an admin user;
- the application connects as `lumen_app` (`NOSUPERUSER NOBYPASSRLS`, created
  by `migrations/0002_app_role.sql`);
- `assertRlsEnforced()` runs before the server accepts a request and refuses to
  start on a bypassing role, or when a table with a `tenant_id` column has no
  RLS enabled.

The integration tests connect as `lumen_app` too. Running them as an admin
would make every isolation assertion pass for the wrong reason.

### `tenants` itself

The `tenants` table is not tenant-scoped — a tenant row *is* the boundary, it
cannot sit inside one. `lumen_app` has `SELECT` on it (login resolves a slug to
an id before any tenant context exists) and nothing more. Provisioning a school
is an admin task.

## 2. Identity

A person belongs to exactly one tenant. The unique key on `users` is
`(tenant_id, lower(email))`, so the same address can be a parent at one school
and a teacher at another, and those are two different people with two different
passwords.

Login therefore takes a tenant slug alongside the email:

```
POST /auth/login  { "tenantSlug": "northwood", "email": "...", "password": "..." }
```

- Passwords are hashed with **scrypt** at the OWASP baseline (N=2¹⁷, r=8, p=1),
  encoded as `scrypt$N$r$p$salt$hash` so the cost can be raised later without
  invalidating existing hashes. Comparison is constant-time.
- An unknown school, an unknown email and a wrong password all return the same
  401 body, and an unknown email is still verified against a dummy hash so the
  three take the same time. The login endpoint is not an account-enumeration
  oracle.
- Access tokens are HS256 JWTs, 15 minutes by default, with `iss`/`aud`/`jti`
  and the algorithm pinned on verification (an unpinned verifier accepts
  `alg: none`).
- Refresh tokens are opaque random strings; only their SHA-256 is stored, and
  using one revokes it. A database dump cannot be replayed as a live session.

**Access tokens carry roles, not permissions.** Permissions are resolved from
the matrix on every request, so changing what a role may do takes effect at
once instead of when the last old token expires.

## 3. Roles and permissions

Six roles, shared across all three products:

| Role | Who they are |
| --- | --- |
| `admin` | The school's own administrator. Everything inside their tenant. |
| `teacher` | Marks attendance, authors questions, evaluates answers. |
| `office` | Front office: admissions, records, fees. No teaching surface. |
| `parent` | Reads their own children's records, attendance, fees and results. Writes nothing. |
| `student` | Reads their own record and results, attempts exams. |
| `examiner` | External paper setter/evaluator. Question bank and evaluation only — **no access to student personal records.** |

Permissions are `<resource>:<action>` strings (`attendance:mark`,
`paper:approve`, …). The full vocabulary and the matrix live in
`src/rbac/permissions.ts`.

Routes gate on a permission, never on a role:

```ts
router.post('/students', requirePermission('student:manage'), handler);
```

A role gaining or losing an ability is then a one-line change in the matrix and
nothing else moves. A role check scattered across forty routes is forty places
to get it wrong.

### Two layers, not one

RBAC answers *may this kind of user do this kind of thing*. It does not answer
*may this parent see this child*. That is the ownership filter, which landed
with the SIS data model (LS-27):

- `student:read` (admin, teacher, office) sees every student in the school.
- `student:read_own` (parent, student) sees only students linked to the
  caller's login.

`studentScope(principal)` picks between them by permission, and the student
queries apply it. The matrix is still the outer gate; the scope is the inner
one.

## 4. Error contract

Every route returns the same shape:

```json
{ "error": { "code": "forbidden", "message": "...", "details": [] } }
```

Codes in use: `bad_request`, `unauthorized`, `forbidden`, `not_found`,
`conflict`, `invalid_credentials`, `invalid_refresh_token`, `account_disabled`,
`internal_error`. Internal errors are logged in full and returned as a generic
message — the detail may quote SQL. Constraint violations (a duplicate, an
overlap, a missing reference) are translated into `conflict` or `bad_request`
with a fixed message by `src/http/databaseErrors.ts`.

Note what a cross-tenant fetch returns. `GET /students/:id` for another
school's student is a **404**, not a 403: the row is invisible to the query, so
"does not exist" and "not yours" are indistinguishable to the caller. That is
deliberate. A 403 would confirm the id is real.

The gateway story adds a request id to this envelope. The shape stays as it is.

## 5. What the tests prove

`npm test` — 148 tests. The list below is the auth and tenancy part; the SIS
schema and setup API tests are described in `sis-data-model.md`.

Unit (`tests/unit/`): the role matrix, scrypt hashing, and token
forgery — wrong secret, tampered payload, `alg: none`, expired, wrong audience,
unknown role claim.

Integration against real PostgreSQL (`tests/integration/`):

- a tenant sees only its own rows, including when it asks for another tenant's
  row by its real id;
- cross-tenant `UPDATE`/`DELETE` affect zero rows, and an `INSERT` stamped with
  another tenant's id is rejected by the policy;
- with no tenant context, every tenant-scoped table reads empty;
- the context does not survive the transaction, including when the callback
  throws;
- the same email in two schools resolves to two different users with different
  roles;
- a refresh token is single-use and is not accepted against another school;
- a teacher may read students but not create them; a parent may not either;
- the startup guard rejects a superuser connection and a `tenant_id` table with
  no policy.

## 6. Follow-ups

- ~~**Ownership filter** for `parent` and `student`~~ — done for students
  (LS-27). Attendance, fees and results must reuse `studentScope`.
- **Request id and audit log** — the gateway story; `tenant_id` and actor are
  already on every request via the principal.
- **Rate limiting on `/auth/login`** — belongs at the gateway, not here.
- **Password reset and invitations** — no user-facing account flow yet; users
  are created server-side.
