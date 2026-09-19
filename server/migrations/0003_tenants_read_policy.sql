-- 0003_tenants_read_policy.sql
-- Makes the `tenants` table's access rule explicit.
--
-- Supabase enables row level security on new tables in `public` by default.
-- RLS enabled with no policy means the table reads as empty for any role that
-- does not bypass RLS — so on Supabase, lumen_app saw no tenants at all and
-- every login failed with "Email or password is incorrect", because the slug
-- lookup found nothing. Plain PostgreSQL does not enable RLS by default, so
-- this only appeared on the hosted database.
--
-- The fix is not to switch RLS off. It is to say what was previously implicit:
-- tenants is readable by the application, and writable only through an admin
-- connection. lumen_app has no INSERT, UPDATE or DELETE grant on it
-- (migration 0002), so a read policy is the whole of its access.
--
-- This is deliberately NOT tenant-scoped. A tenant row is the boundary; it
-- cannot sit inside one. Login has to resolve a slug before any tenant context
-- exists.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_readable ON tenants;
CREATE POLICY tenants_readable ON tenants FOR SELECT USING (true);
