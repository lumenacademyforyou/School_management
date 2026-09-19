-- 0002_app_role.sql
-- The application's own database role.
--
-- Row level security is bypassed outright by superusers and by roles with
-- BYPASSRLS, so the tenant boundary only exists if the application connects as
-- a role that has neither. This migration creates that role; migrations
-- themselves are still run by an admin user.
--
-- The password is set out of band by deployment (INF), not here, so no
-- credential is ever committed:
--     ALTER ROLE lumen_app LOGIN PASSWORD '<from the secret store>';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lumen_app') THEN
    CREATE ROLE lumen_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE lumen_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO lumen_app;

-- Read-only on tenants: the app resolves a slug at login and never edits a
-- tenant row through a product route. Tenant administration is a separate,
-- admin-connection task.
GRANT SELECT ON tenants TO lumen_app;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON users, user_roles, refresh_tokens, student_records
  TO lumen_app;

-- Future tenant-scoped tables get the same grant automatically, so a new
-- product table cannot be forgotten and then silently fail in staging.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lumen_app;
