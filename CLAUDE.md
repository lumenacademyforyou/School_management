# CLAUDE.md — Lumen School Management Platform

Context for anyone (human or Claude) picking up work in this repo.

## What this repo is

The **shared multi-tenant platform base** for three products:

1. **School MMS** — admissions, student info, attendance, fees.
2. **QPG** — Question Paper Generator.
3. **Assessment** — exams, evaluation, results.

The foundation here (auth, RBAC, tenant boundary) is written once and consumed
by all three. Work is tracked in Jira; the full task list is committed at
`docs/jira/jira-tasks.csv`, with a readable version in `docs/roadmap.md`.

**A third product already exists.** The assessment engine (Prisma, its own
Supabase project) was built before this repo and is not in it. It has no tenant
concept at all, which is the main cost of integrating it — see
`docs/integration-map.md` before planning any assessment work.

## Team and branches

| Who | Role | Branch |
| --- | --- | --- |
| Santhosh Kumar | SD1 | `CSK-branch` |

Work is committed to `CSK-branch`. Feature branches merge into it.

## Stack

Node 20+ · TypeScript · Express 5 · PostgreSQL 17 (Supabase) · Vitest · ESLint.
Web front end will be React + TypeScript (Phase 2 reuses the logic layer for
React Native / Expo).

## The three rules that matter most

Break any of these and a school sees another school's data:

1. **The tenant comes from the access token.** Never from a header, query
   string or request body.
2. **Every tenant-scoped table** has `tenant_id`, plus the RLS policy pattern in
   `migrations/0001_foundation.sql`, and **every query on it runs inside
   `withTenant()`**.
3. **Routes gate on a permission, never a role** — `requirePermission('student:manage')`,
   not `if (role === 'admin')`.

## The database role trap

PostgreSQL superusers and `BYPASSRLS` roles ignore row level security silently.
**Supabase's default `postgres` role has `BYPASSRLS`.** If the app connects as
it, the tenant boundary does not exist.

So there are always two connections:

- **admin** (`postgres`) — migrations and seeding only.
- **`lumen_app`** — what the application uses. Created by
  `migrations/0002_app_role.sql`; `NOSUPERUSER NOBYPASSRLS`.

`assertRlsEnforced()` runs before the server accepts a request and refuses to
start on a bypassing role, or when a `tenant_id` table is missing its policy.
If you see *"Refusing to start: the database role … bypasses row level
security"*, that guard is working — fix `DATABASE_URL`, don't remove the guard.

## Commands

```bash
npm run migrate    # admin connection; also sets the lumen_app password
npm run seed       # demo school, one user per role
npm run dev        # local server on :3000
npm run check      # typecheck + lint + test — run before every commit
npm test           # 73 tests; needs a LOCAL PostgreSQL (it truncates tables)
```

**On a fresh database the order above is load-bearing**: `dev` connects as
`lumen_app`, which has no password until `migrate` sets it.

Seeing it work: `/demo` in a browser runs eight checks against the live API and
shows each one passing. `requests.http` drives the same endpoints from VS Code
with the REST Client extension.

All scripts read `.env` automatically (`node --env-file-if-exists`), so no
shell-specific variable syntax is needed — the same commands work in bash and
PowerShell. `.env` needs `ADMIN_DATABASE_URL` (migrations, seeding) and
`DATABASE_URL` (the app, as `lumen_app`).

## Conventions

- Comments explain *why*, not *what*. The code says what it does.
- Every security-relevant behaviour gets a test that would fail if someone
  removed it. Isolation tests connect as `lumen_app`, never as an admin —
  otherwise they pass for the wrong reason.
- Tests never get skipped, disabled or quarantined to make a run green.
- No credentials in git. `.env` is gitignored; `.env.example` holds placeholders.

## Where to read next

- `README.md` — how to run it.
- `docs/auth-rbac-tenancy.md` — design decisions and reasoning.
- `docs/environments.md` — Supabase projects and connection strings.
- `docs/integration-map.md` — how School MMS, QPG and Assessment fit together.
- `docs/project-log.md` — what was done, day by day.
- `docs/daily-workflow.md` — how a day of work runs.
- `docs/roadmap.md` — every sprint, epic and task, and SD1's own list.
- `docs/troubleshooting.md` — errors hit while setting this up, and what each
  one actually means. Check here first when something will not start.
