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

Requires Node 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env        # then set JWT_SECRET to a long random value

createdb lumen_platform

# Migrations run as an admin user.
ADMIN_URL=postgres://postgres@localhost:5432/lumen_platform
DATABASE_URL=$ADMIN_URL npm run migrate

# Migration 0002 creates the lumen_app role without a password. Set one:
psql "$ADMIN_URL" -c "ALTER ROLE lumen_app LOGIN PASSWORD 'choose-one';"

# Demo school with one user per role.
ADMIN_DATABASE_URL=$ADMIN_URL npm run seed

# The app itself connects as lumen_app — never as an admin (see below).
DATABASE_URL=postgres://lumen_app:choose-one@localhost:5432/lumen_platform npm run dev
```

```bash
curl -s localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"tenantSlug":"demo-school","email":"teacher@demo-school.test","password":"demo-password-123"}'
```

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
