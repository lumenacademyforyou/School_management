# CLAUDE.md — Lumen School Management Platform

Context for anyone (human or Claude) picking up work in this repo.

## What this repo is

The **shared multi-tenant platform base** for three products:

1. **School MMS** — admissions, student info, attendance, fees.
2. **QPG** — Question Paper Generator.
3. **Assessment** — exams, evaluation, results.

The foundation here (auth, RBAC, tenant boundary) is written once and consumed
by all three. Work is tracked in Jira; the task list lives in
`Jira_Import_Tasks_FastTrack.csv` (not committed — ask the project lead).

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
npm run check      # typecheck + lint + test — run before every commit
npm test           # 73 tests; needs PostgreSQL
npm run dev        # local server
npm run migrate    # needs an ADMIN connection
npm run seed       # demo school, one user per role
```

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
