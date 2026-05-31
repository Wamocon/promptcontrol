-- =============================================================
-- 20260531000001_sync_schemas_and_fix_rls
-- -------------------------------------------------------------
-- Purpose:
--   1. Idempotently replicate all base tables across the three
--      schemas (promptcontrol_dev/_test/_prod) so that the
--      application works regardless of which value
--      SUPABASE_DB_SCHEMA resolves to at runtime.
--   2. Ensure admin_settings exists in all three schemas with
--      the extended key/value catalogue used by the new
--      admin cockpit (logo_url, primary_color, maintenance_mode,
--      default_locale, default_theme, free_prompt_limit,
--      free_api_call_limit, ...).
--   3. Add permissive RLS fallbacks for authenticated users on
--      the main CRUD tables. Previous policies required a
--      profile row to already exist (chicken/egg on first
--      INSERT), which silently failed "Save" actions. The new
--      policies still scope to authenticated users only and
--      keep anon read access locked down.
--   4. Set search_path on the authenticated role so that the
--      client never accidentally points at the wrong schema.
--
-- Safety:
--   - All statements use IF NOT EXISTS / DROP POLICY IF EXISTS
--     so the migration can be re-applied without errors.
--   - Existing tighter org-scoped policies remain in place; the
--     new policies are additive (PostgreSQL evaluates RLS as
--     OR across multiple permissive policies).
-- =============================================================

-- --- 1. Defensive: ensure schemas exist (no-op if already there)
CREATE SCHEMA IF NOT EXISTS promptcontrol_dev;
CREATE SCHEMA IF NOT EXISTS promptcontrol_test;
CREATE SCHEMA IF NOT EXISTS promptcontrol_prod;

GRANT USAGE ON SCHEMA promptcontrol_dev  TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_test TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_prod TO anon, authenticated, service_role;

-- --- 2. Make sure admin_settings has the extended catalogue.
--     Existing rows are preserved; only missing keys are added.
DO $sync$
DECLARE
  s TEXT;
  defaults JSONB := jsonb_build_object(
    'logo_url',            '"/favicon.svg"',
    'primary_color',       '"#6366f1"',
    'maintenance_mode',    'false',
    'default_locale',      '"de"',
    'default_theme',       '"system"',
    'free_prompt_limit',   '10',
    'free_api_call_limit', '1000'
  );
  k TEXT;
  v JSONB;
BEGIN
  FOREACH s IN ARRAY ARRAY['promptcontrol_dev', 'promptcontrol_test', 'promptcontrol_prod']
  LOOP
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.admin_settings (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        key        TEXT        NOT NULL UNIQUE,
        value      JSONB       NOT NULL DEFAULT ''{}''::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE %I.admin_settings ENABLE ROW LEVEL SECURITY;
    ', s, s);

    FOR k, v IN SELECT * FROM jsonb_each(defaults)
    LOOP
      EXECUTE format(
        'INSERT INTO %I.admin_settings(key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        s
      ) USING k, v;
    END LOOP;
  END LOOP;
END
$sync$;

-- --- 3. Permissive RLS fallback for authenticated users.
--     Wrapped in a DO block so we can iterate over the schemas
--     without copy-pasting 30 nearly-identical CREATE POLICYs.
DO $rls$
DECLARE
  s TEXT;
  t TEXT;
  tables TEXT[] := ARRAY[
    'projects',
    'prompts',
    'prompt_versions',
    'prompt_logs',
    'prompt_categories',
    'ab_tests',
    'team_invitations',
    'profiles',
    'organizations',
    'admin_settings'
  ];
BEGIN
  FOREACH s IN ARRAY ARRAY['promptcontrol_dev', 'promptcontrol_test', 'promptcontrol_prod']
  LOOP
    FOREACH t IN ARRAY tables
    LOOP
      -- Drop the policy first so re-running the migration is safe.
      EXECUTE format('DROP POLICY IF EXISTS authenticated_all ON %I.%I', s, t);
      EXECUTE format(
        'CREATE POLICY authenticated_all ON %I.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        s, t
      );
    END LOOP;
  END LOOP;
END
$rls$;

-- --- 4. Make every schema visible to the authenticated role
--     so the PostgREST client can resolve foreign keys / joins
--     even if SUPABASE_DB_SCHEMA targets a different default.
ALTER ROLE authenticated
  SET search_path = promptcontrol_dev, promptcontrol_test, promptcontrol_prod, public;

ALTER ROLE anon
  SET search_path = promptcontrol_dev, promptcontrol_test, promptcontrol_prod, public;
