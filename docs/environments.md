# Environments

## Supabase projects

Both live in the org `lumenacademyforyou's Org` (`lredwagrsivqvxcijdsw`).
**They are two separate databases.** There is no SQL join between them.

| Project | Ref | Region | Postgres | Holds |
| --- | --- | --- | --- | --- |
| `School_management` | `jiyfmnwtomtmjnubdkcf` | `ap-southeast-2` (Sydney) | 17.6 | This repo: the foundation, then SIS |
| `Assessment_Tool` | `trjnkmaudsvwgsdjgpvh` | `ap-northeast-1` (Tokyo) | 17.6 | The existing NEET engine (Prisma) |

> **Region note.** The pilot school is in India; neither region is close to it.
> `School_management` is still empty, so recreating it in `ap-south-1` (Mumbai)
> costs nothing today and gets harder every day after the pilot loads data.
> This is a decision for the project lead — see `docs/integration-map.md`.

## Connection strings

Two connections, always. See the "database role trap" in `CLAUDE.md` for why.

### Admin — migrations and seeding only

Supabase Dashboard → Project Settings → Database. Shared pooler:

```
postgresql://postgres.jiyfmnwtomtmjnubdkcf:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

Percent-encode any special characters in the password.

### Application — `lumen_app`

After running the migrations once, set the role's password on the admin
connection:

```sql
ALTER ROLE lumen_app LOGIN PASSWORD '<pick a strong one>';
```

Then the app's own URL is the same host and database with that user:

```
postgresql://lumen_app:[LUMEN-APP-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

The pooler is fine for this codebase: tenant context is set with `SET LOCAL`
**inside** an explicit transaction, which survives transaction-mode pooling.

## Two Supabase behaviours that differ from plain PostgreSQL

1. **RLS is enabled automatically on new `public` tables.** RLS on with no
   policy means the table reads as empty for any role that does not bypass it.
   This silently broke login — `lumen_app` could not see `tenants`, so the slug
   lookup found nothing and every password looked wrong. Migration 0003 makes
   the read rule explicit. Any new table needs a policy, not just RLS.
2. **The pooler rewrites usernames.** Through
   `aws-0-<region>.pooler.supabase.com` the user is `<role>.<project-ref>` —
   so `lumen_app` connects as `lumen_app.jiyfmnwtomtmjnubdkcf`. On the direct
   host (`db.<ref>.supabase.co`) it is plain `lumen_app`.

Append `?sslmode=require` to both URLs: Supabase refuses unencrypted
connections.

## First-time setup against Supabase

```bash
export ADMIN_URL='postgresql://postgres.jiyfmnwtomtmjnubdkcf:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres'

DATABASE_URL="$ADMIN_URL" npm run migrate
psql "$ADMIN_URL" -c "ALTER ROLE lumen_app LOGIN PASSWORD 'choose-one';"
ADMIN_DATABASE_URL="$ADMIN_URL" npm run seed

# The app connects as lumen_app — never as postgres.
DATABASE_URL='postgresql://lumen_app:choose-one@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres' npm run dev
```

## Local PostgreSQL (alternative)

Nothing requires Supabase. A local Postgres works identically — see `README.md`.
Use local for day-to-day development and tests; it is faster and cannot leak.

## Secrets

Never commit a password. `.env` is gitignored; `.env.example` holds
placeholders only. Rotate the `lumen_app` password if it is ever pasted into a
chat, an issue or a screenshot.

## Not yet decided

- Staging and production projects (currently there is one shared project).
- Where the app itself is hosted. Nothing is deployed yet.
- Whether Supabase Auth or the foundation's own auth is the single identity
  system — see `docs/integration-map.md`.
