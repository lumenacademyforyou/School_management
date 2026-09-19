-- 0001_foundation.sql
-- Shared platform base: tenants, users, roles and the tenant boundary.
--
-- The tenant boundary is enforced in the database with row level security so
-- that an application bug cannot leak data across schools. Every tenant-scoped
-- table carries tenant_id and is readable only when the session variable
-- app.current_tenant matches it. FORCE ROW LEVEL SECURITY makes the policy
-- apply to the table owner too, so there is no connection that quietly sees
-- everything.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
-- Not tenant-scoped: a tenant row is the boundary, it cannot sit inside one.
-- Reads are limited to slug lookups during login and to platform admin routes.
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name        text NOT NULL,
  -- Which product surfaces this tenant has bought: school, qpg, assessment.
  products    text[] NOT NULL DEFAULT ARRAY['school']::text[],
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'suspended', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
-- A person belongs to exactly one tenant. The same email may exist in two
-- different schools, so the unique key is (tenant_id, lower(email)).
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          text NOT NULL CHECK (position('@' in email) > 1),
  full_name      text NOT NULL,
  password_hash  text NOT NULL,
  status         text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'disabled')),
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_key
  ON users (tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
-- Role names are a closed set shared by all three products. The permissions
-- each role grants live in application code (src/rbac/permissions.ts) so that
-- adding a permission does not need a migration or a token re-issue.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN
              ('admin', 'teacher', 'office', 'parent', 'student', 'examiner')),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_tenant_idx ON user_roles (tenant_id);

-- ---------------------------------------------------------------------------
-- Refresh tokens
-- ---------------------------------------------------------------------------
-- Only the SHA-256 of the token is stored, so a database dump cannot be
-- replayed as a live session.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);

-- ---------------------------------------------------------------------------
-- Tenant boundary
-- ---------------------------------------------------------------------------
-- current_setting(..., true) returns NULL when the variable was never set, and
-- `tenant_id = NULL` is NULL rather than true, so a connection with no tenant
-- context reads nothing. That is the intended default: fail closed.
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid $$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'user_roles', 'refresh_tokens'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) '
      'WITH CHECK (tenant_id = current_tenant_id())',
      t || '_tenant_isolation', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Demonstration of the boundary for product tables
-- ---------------------------------------------------------------------------
-- student_records is the first tenant-scoped product table. The SIS story
-- replaces it with the real schema; it is here so the foundation ships with a
-- worked example of the pattern every product table must follow.
CREATE TABLE IF NOT EXISTS student_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  class_label text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_records_tenant_idx ON student_records (tenant_id);

ALTER TABLE student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_records_tenant_isolation ON student_records;
CREATE POLICY student_records_tenant_isolation ON student_records
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
