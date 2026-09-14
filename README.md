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
| Role → permission matrix for all six roles | `src/rbac/permissions.ts` |
| Tenant-scoped database access | `src/db/tenantContext.ts` |
| Startup guard for the tenant boundary | `src/db/assertRlsEnforced.ts` |
| Login, refresh, logout | `src/auth/authService.ts` |
| `authenticate` / `requirePermission` middleware | `src/http/middleware/` |
| Shared error contract | `src/http/errors.ts` |
| Worked example of a tenant-scoped route | `src/http/routes/studentRoutes.ts` |

Design notes and the reasoning behind them: [`docs/auth-rbac-tenancy.md`](docs/auth-rbac-tenancy.md).

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
DATABASE_URL=postgres://lumen_app:devpass@localhost:5432/lumen_platform
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

### 4. Give the app role a password

Migration 0002 creates `lumen_app` without one. Set it on the admin connection,
in psql, pgAdmin, or the Supabase SQL editor:

```sql
ALTER ROLE lumen_app LOGIN PASSWORD 'devpass';
```

Use the same password you put in `DATABASE_URL`.

### 5. Seed and run

```bash
npm run seed
npm run dev
```

```bash
curl -s localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"tenantSlug":"demo-school","email":"teacher@demo-school.test","password":"demo-password-123"}'
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
