# Lumen Platform — Shared Foundation

The multi-tenant base that School MMS, the Question Paper Generator and
Assessment all build on: **authentication, role-based access control and the
tenant boundary**, written once.

Jira: `FND: Extend shared auth, RBAC and tenant model for all three products`
(epic *FND: Foundation & Shared Platform*).

## What is in here

| Area | Where |
| --- | --- |
| Tenant, user, role and refresh-token schema | `migrations/0001_foundation.sql` |
| Unprivileged application DB role | `migrations/0002_app_role.sql` |
| School schema: years, classes, sections, staff, students, guardians, enrollments | `migrations/0004_sis_core.sql` |
| Role → permission matrix for all six roles | `src/rbac/permissions.ts` |
| Tenant-scoped database access | `src/db/tenantContext.ts` |
| Startup guard for the tenant boundary | `src/db/assertRlsEnforced.ts` |
| Login, refresh, logout | `src/auth/authService.ts` |
| `authenticate` / `requirePermission` middleware | `src/http/middleware/` |
| Shared error contract, and constraint violations mapped into it | `src/http/errors.ts`, `src/http/databaseErrors.ts` |
| School setup API: academic years, classes, sections, wizard status | `src/http/routes/` (`setup`, `academicYear`, `class`, `section`) |
| Students, with the parent/student ownership filter | `src/http/routes/studentRoutes.ts`, `src/rbac/authorize.ts` |

Design notes and the reasoning behind them:
[`docs/auth-rbac-tenancy.md`](docs/auth-rbac-tenancy.md) (auth, RBAC, tenancy) and
[`docs/sis-data-model.md`](docs/sis-data-model.md) (school schema and setup API).

## Running it locally

Requires Node 20+ and a PostgreSQL database (local, or a Supabase project).

### 1. Install

```bash
npm install
```

### 2. Create a `.env`

Copy `.env.example` to `.env` and fill it in. **All the npm scripts read `.env`
automatically** — you never need to set variables in your shell, so the same
commands work in bash, zsh and PowerShell:

```ini
ADMIN_DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/lumen_platform
DATABASE_URL=postgres://lumen_app:devpassword@localhost:5432/lumen_platform
LUMEN_APP_PASSWORD=devpassword
JWT_SECRET=a-long-random-value-of-at-least-32-characters
PORT=3000
```

Two URLs, not one. `ADMIN_DATABASE_URL` creates tables and roles;
`DATABASE_URL` is what the app runs as. See "Why two database users" below —
the server refuses to start if you get this wrong.

### 3. Create the database and migrate

```bash
createdb lumen_platform     # or create it in pgAdmin / the Supabase dashboard
npm run migrate
```

### 4. Seed and run

```bash
npm run seed
npm run dev
```

`npm run migrate` also sets the `lumen_app` role's password from
`LUMEN_APP_PASSWORD`, so no `psql` is needed — keep it equal to the password in
`DATABASE_URL`. Migration 0002 deliberately creates the role without a login,
because a password must never sit in a committed migration.

```bash
curl -s localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"tenantSlug":"demo-school","email":"teacher@demo-school.test","password":"demo-password-123"}'
```

## Seeing it work

There is no web UI yet — this is an API, so the output is JSON. Three places to
look:

1. **<http://localhost:3000/demo>** — a page that calls the API for real and
   shows each guarantee holding or failing: a teacher refused `student:manage`,
   an admin allowed it, reads confined to one school, a forged token rejected.
   a parent seeing only their own child, and the setup wizard's status.
   Nothing on it is mocked, so it fails honestly if the server is down or the
   seed has not run. It is a development aid, not product UI, and is not served
   when `NODE_ENV=production`.
2. **<http://localhost:3000/health>** in a browser → `{"status":"ok"}`.
3. **`requests.http` in this repo.** Install the VS Code extension
   *REST Client* (`humao.rest-client`), open the file, and click the
   **Send Request** link above any block. Logging in first lets the rest reuse
   the token automatically. It walks the whole surface: login, `/auth/me` with
   resolved permissions, a teacher being refused `student:manage`, an admin
   creating a student, and a wrong password returning the same body as an
   unknown account.
4. **Your database**, for the rows themselves — psql, pgAdmin, or the Supabase
   Table Editor. After `npm run seed` you should see one tenant, six users (one
   per role), the 2026-27 academic year, LKG to Class 12 with sections A and B,
   and three students in Class 10.

No extension handy? PowerShell can do it:

```powershell
Invoke-RestMethod http://localhost:3000/health

$body = @{ tenantSlug='demo-school'; email='teacher@demo-school.test'; password='demo-password-123' } | ConvertTo-Json
$session = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -ContentType 'application/json' -Body $body
$session.user.permissions

Invoke-RestMethod http://localhost:3000/auth/me -Headers @{ Authorization = "Bearer $($session.accessToken)" }
```

### Windows notes

- PowerShell does not support `VAR=value command`. That is why everything goes
  in `.env` instead — use the commands exactly as written above.
- `psql` and `createdb` only exist if PostgreSQL is installed. Install it with
  `winget install -e --id PostgreSQL.PostgreSQL.17`, then add
  `C:\Program Files\PostgreSQL\17\bin` to your PATH and open a new terminal.
- No PostgreSQL install? Point `ADMIN_DATABASE_URL` and `DATABASE_URL` at a
  Supabase project instead and create the database and role from its SQL
  editor. `npm test` still needs a local one — see below.

### Why two database users

PostgreSQL superusers and `BYPASSRLS` roles ignore row level security
completely, with no error. If the app connects as one, the tenant boundary is
simply not there. So migrations run as an admin and the application runs as
`lumen_app`, and `assertRlsEnforced()` fails startup if that is ever
misconfigured.

## Checks

```bash
npm run typecheck
npm run lint
npm test          # needs PostgreSQL; see below
npm run check     # all three
```

The integration tests need a database. They migrate it themselves and connect
as `lumen_app`, so the isolation assertions cannot pass for the wrong reason:

```bash
createdb lumen_platform_test
TEST_ADMIN_DATABASE_URL=postgres://postgres@localhost:5432/lumen_platform_test npm test
```

`npm test` does not read `.env`, so set `TEST_ADMIN_DATABASE_URL` in the shell
(PowerShell: `$env:TEST_ADMIN_DATABASE_URL = '...'`). Check the port: the
Windows PostgreSQL installer picks 5433 when 5432 is taken.

## Using the foundation from a product

```ts
import {
  authenticate,
  requirePermission,
  withTenant,
} from '@lumen/platform-foundation';

router.get(
  '/attendance',
  authenticate(config),
  requirePermission('attendance:read'),
  async (req, res) => {
    const rows = await withTenant(req.principal!.tenantId, (client) =>
      client.query('SELECT * FROM attendance_days'),
    );
    res.json(rows);
  },
);
```

Three rules, and everything else follows:

1. The tenant comes from the access token. Never from a header, query string or
   body.
2. Every tenant-scoped table has `tenant_id` plus the RLS policy from
   `0001_foundation.sql`, and every query on it runs inside `withTenant`.
3. Routes ask for a **permission**, never for a role.
