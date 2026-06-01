-- =============================================
-- Expose custom schemas to PostgREST
-- =============================================
-- Without this, the Supabase JS client sending Accept-Profile: promptcontrol_dev
-- gets rejected by PostgREST with "invalid schema promptcontrol_dev".
-- This causes all DB queries to fail -> profile=null -> Free Plan, no Admin area,
-- "Profil nicht gefunden" errors everywhere.
--
-- PostgREST reads pgrst.db_schemas from the authenticator role at startup/reload.
-- Adding our 3 custom schemas here makes the Accept-Profile header accepted.
-- =============================================

-- Expose all 3 custom schemas to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public,promptcontrol_dev,promptcontrol_test,promptcontrol_prod';

-- Set default search_path for API roles so unqualified table references resolve
-- to promptcontrol_dev first, then public.
ALTER ROLE anon SET search_path = promptcontrol_dev, public;
ALTER ROLE authenticated SET search_path = promptcontrol_dev, public;
ALTER ROLE service_role SET search_path = promptcontrol_dev, public;

-- Ensure all tables in the 3 schemas have the necessary grants
-- (these may already be set via initial migration, adding here for completeness)
GRANT USAGE ON SCHEMA promptcontrol_dev TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_test TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_prod TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA promptcontrol_dev TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA promptcontrol_test TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA promptcontrol_prod TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA promptcontrol_dev TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA promptcontrol_test TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA promptcontrol_prod TO anon, authenticated, service_role;

-- Signal PostgREST to reload its configuration
NOTIFY pgrst, 'reload config';
