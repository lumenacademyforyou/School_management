# CLAUDE.md — Lumen School Management Platform

Context for anyone (human or Claude) picking up work in this repo.

## What this repo is

One repository, two npm workspaces:

| Workspace | What it holds |
| --- | --- |
| `server/` | The multi-tenant API: auth, RBAC, the tenant boundary, SIS schema and migrations. |
| `web/` | Three React apps: the staff admin console (`web/src`), the parent app and the teacher app (`web/apps`). |

The workspaces keep their own `package.json`, TypeScript version and test
runner for now; unifying the toolchain is tracked separately. Run anything from
the repo root with `--workspace server` or `--workspace web`, or use the root
scripts below.

The server is the **shared multi-tenant platform base** for three products:

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

Work is committed to `CSK-branch`. Feature branches merge into it. The web apps
arrived from `ui_design`, which is now folded into `web/`.

## Stack

Node 20+ · TypeScript · Express 5 · PostgreSQL 17 (Supabase) · Vitest · ESLint
in `server/`. React 19 · Vite 6 · Tailwind 4 in `web/` (Phase 2 reuses the
logic layer for React Native / Expo).

## The three rules that matter most

Break any of these and a school sees another school's data:

1. **The tenant comes from the access token.** Never from a header, query
   string or request body.
2. **Every tenant-scoped table** has `tenant_id`, plus the RLS policy pattern in
   `migrations/0001_foundation.sql`, and **every query on it runs inside
   `withTenant()`**. References between tenant-scoped tables are composite
   foreign keys on `(tenant_id, id)` — RLS does not check the row a foreign key
   points at (see `docs/sis-data-model.md`).
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

From the repo root:

```bash
npm install        # installs both workspaces
npm run migrate    # admin connection; also sets the lumen_app password
npm run seed       # demo school: one user per role, classes, sections, students
npm run dev:api    # the API on :4000
npm run dev        # the three web apps on :3000 (admin), :3001, :3002
npm run typecheck  # both workspaces
npm run test       # both workspaces
```

The API listens on **4000**, not 3000: the web dev servers already use
3000-3004. Inside a workspace the original commands still apply, e.g.
`npm run check --workspace server` (typecheck + lint + test before every
commit) and `npm run build:admin --workspace web`.

`npm run test --workspace server` is 148 tests and needs a **local
PostgreSQL** (it truncates tables); 62 of them are unit tests that run without
one. `npm run test --workspace web` is 96 logic tests and needs nothing.

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
- `web/README` conventions live in the web app's own source comments; the
  design tokens and their reasoning are in `web/src/index.css`.
- `docs/auth-rbac-tenancy.md` — design decisions and reasoning.
- `docs/sis-data-model.md` — the school schema, ownership filter and setup API.
- `docs/frontend-integration.md` — how the web apps get wired onto the API, the
  three places the two halves disagree, and what the design pass already fixed.
  Read it before starting anything in LS-162…LS-176.
- `docs/environments.md` — Supabase projects and connection strings.
- `docs/integration-map.md` — how School MMS, QPG and Assessment fit together.
- `docs/project-log.md` — what was done, day by day.
- `docs/daily-workflow.md` — how a day of work runs.
- `docs/roadmap.md` — every sprint, epic and task, and SD1's own list.
- `docs/troubleshooting.md` — errors hit while setting this up, and what each
  one actually means. Check here first when something will not start.
