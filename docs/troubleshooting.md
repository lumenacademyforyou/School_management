# Troubleshooting

Errors hit while getting this running, and what each one actually means. Search
this file for the message you are seeing.

---

## `createdb : The term 'createdb' is not recognized` (and `psql`)

PostgreSQL's command line tools are not installed, or not on PATH.

You do **not** need them. `npm run migrate` creates the schema and sets the
`lumen_app` password by itself, and a database can be created from pgAdmin or
the Supabase dashboard.

If you want them anyway: `winget install -e --id PostgreSQL.PostgreSQL.17`,
then add `C:\Program Files\PostgreSQL\17\bin` to PATH and **open a new
terminal** — PATH changes do not reach terminals that are already open.

---

## `DATABASE_URL=... : The term ... is not recognized`

`VAR=value command` is bash syntax. PowerShell does not support it.

Nothing needs it: every script reads `.env` automatically. Put the variables
there and run the plain command.

---

## `SyntaxError: missing ) after argument list` pointing at `node_modules/.bin/tsx`

On Windows, `node_modules/.bin/tsx` is a **bash** shim, so Node tried to parse
shell script as JavaScript. Fixed in the npm scripts, which now use
`node --import tsx <file>` — tsx resolved as a module, not as a path into
`.bin`. If you see this, your `package.json` is out of date: `git pull`.

---

## `Error: self-signed certificate in certificate chain` (`SELF_SIGNED_CERT_IN_CHAIN`)

Connecting to a hosted database without a usable TLS mode. The current `pg`
treats `sslmode=require` as `verify-full`, and Supabase's pooler chain is not in
Node's trust store.

For development, append to both URLs in `.env`:

```
?uselibpqcompat=true&sslmode=require
```

That is libpq's own meaning of `require`: encrypt, do not verify the server's
certificate. For production, download the project's CA (Supabase Dashboard →
Project Settings → Database → SSL Configuration) and use
`?sslmode=verify-full&sslrootcert=/path/to/prod-ca.crt`.

---

## `error: (EAUTHQUERY) user not found in the database`
## `password authentication failed for user "lumen_app"`

The same cause with two different wordings — Supabase's pooler says the first,
plain PostgreSQL the second.

`lumen_app` has no password yet. Migration 0002 creates the role deliberately
without a login, because a password must never live in a committed migration.
`npm run migrate` is what sets it, from `LUMEN_APP_PASSWORD`.

**Order matters on a fresh database and cannot be reordered:**

```
npm run migrate    # admin connection; sets the lumen_app password
npm run seed       # admin connection; demo school
npm run dev        # connects as lumen_app — only works after the above
```

Check that `LUMEN_APP_PASSWORD` is **exactly** the password inside
`DATABASE_URL`, and at least 8 characters.

---

## `LUMEN_APP_PASSWORD must be at least 8 characters`

Exactly what it says. Change it in `.env`, in both the variable and inside
`DATABASE_URL`, and re-run `npm run migrate`.

---

## `Refusing to start: the database role "postgres" bypasses row level security`

**This guard is working. Do not remove it.**

PostgreSQL superusers and `BYPASSRLS` roles ignore row level security silently,
which would delete the tenant boundary — every school would see every other
school's data. Supabase's default `postgres` role has `BYPASSRLS`.

`DATABASE_URL` must point at `lumen_app`. `ADMIN_DATABASE_URL` is the one that
uses `postgres`, and only migrations and seeding use it.

---

## `Refusing to start: these tenant-scoped tables have no row level security`

A table with a `tenant_id` column was created without its policy. Follow the
pattern in `migrations/0001_foundation.sql`: `ENABLE`, `FORCE`, then a policy
using `current_tenant_id()`.

---

## `Refusing to run the test suite against "<host>"`

The tests TRUNCATE every tenant-scoped table between files. Against a hosted
database that destroys real data, so non-local hosts are refused.

Point `TEST_ADMIN_DATABASE_URL` at a local PostgreSQL. `ALLOW_DESTRUCTIVE_TESTS=1`
overrides it, and should only ever be set against a database that exists to be
wiped.

---

## Login always fails with "Email or password is incorrect", even for a user you can see in the table

On Supabase specifically: check `tenants` has a **policy**, not just RLS.

Supabase enables row level security on new tables in `public` automatically.
RLS enabled with no policy reads as empty for any role that does not bypass it,
so `lumen_app` saw no tenants, the slug lookup found nothing, and every password
looked wrong. Migration 0003 fixes this. Plain PostgreSQL does not enable RLS by
default, so the local test suite cannot catch this class of bug — **every new
table on Supabase needs a policy, not just RLS.**

---

## `npm run seed` finished but a role is missing

The seed is idempotent: it skips users that already exist. If a run was
interrupted, just run it again and it will create only what is missing. A
complete seed is one tenant and six users, one per role.

---

## The demo page at /demo shows failures

It calls the real API, so it fails honestly. Read the detail line under each
failed check — it carries the status code and the response body. A failure on
every check usually means the server is not running or the seed has not been
run.
