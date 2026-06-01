-- =============================================
-- 20260531000003 — Fix recursive RLS on profiles
-- Root cause: profiles_select policy referenced profiles in subquery,
-- causing Postgres to silently return 0 rows (or recursion error).
-- This blocked every server action that looked up profile -> "Profil nicht gefunden".
-- Fix: replace recursive subqueries with SECURITY DEFINER helper functions.
-- Applied to all 3 schemas: promptcontrol_dev, promptcontrol_test, promptcontrol_prod.
-- =============================================

DO $migration$
DECLARE
  s TEXT;
  schemas TEXT[] := ARRAY['promptcontrol_dev','promptcontrol_test','promptcontrol_prod'];
BEGIN
  FOREACH s IN ARRAY schemas LOOP

    -- Helper: return org_id of currently authenticated user (bypasses RLS)
    EXECUTE format($f$
      CREATE OR REPLACE FUNCTION %1$I.current_org_id()
      RETURNS UUID
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = %1$I, public
      AS $body$
        SELECT org_id FROM %1$I.profiles WHERE user_id = auth.uid() LIMIT 1;
      $body$;
    $f$, s);

    EXECUTE format($f$
      CREATE OR REPLACE FUNCTION %1$I.current_role_name()
      RETURNS TEXT
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = %1$I, public
      AS $body$
        SELECT role FROM %1$I.profiles WHERE user_id = auth.uid() LIMIT 1;
      $body$;
    $f$, s);

    EXECUTE format('GRANT EXECUTE ON FUNCTION %1$I.current_org_id() TO anon, authenticated, service_role;', s);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %1$I.current_role_name() TO anon, authenticated, service_role;', s);

    -- === profiles ===
    EXECUTE format('DROP POLICY IF EXISTS dev_profiles_select ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_profiles_select ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_profiles_select ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS profiles_select_self_or_team ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS profiles_insert_self ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS profiles_update_self ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS dev_profiles_insert ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_profiles_insert ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_profiles_insert ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS dev_profiles_update ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_profiles_update ON %1$I.profiles;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_profiles_update ON %1$I.profiles;', s);

    EXECUTE format($p$
      CREATE POLICY profiles_select_self_or_team ON %1$I.profiles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR org_id = %1$I.current_org_id());
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY profiles_insert_self ON %1$I.profiles
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY profiles_update_self ON %1$I.profiles
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    $p$, s);

    -- === organizations ===
    EXECUTE format('DROP POLICY IF EXISTS dev_orgs_select ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_orgs_select ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_orgs_select ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS dev_orgs_update ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_orgs_update ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_orgs_update ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS dev_orgs_insert ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_orgs_insert ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_orgs_insert ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS orgs_select_own ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS orgs_update_admin ON %1$I.organizations;', s);
    EXECUTE format('DROP POLICY IF EXISTS orgs_insert_any ON %1$I.organizations;', s);

    EXECUTE format($p$
      CREATE POLICY orgs_select_own ON %1$I.organizations
      FOR SELECT TO authenticated
      USING (id = %1$I.current_org_id());
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY orgs_update_admin ON %1$I.organizations
      FOR UPDATE TO authenticated
      USING (id = %1$I.current_org_id() AND %1$I.current_role_name() = 'admin');
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY orgs_insert_any ON %1$I.organizations
      FOR INSERT TO authenticated
      WITH CHECK (true);
    $p$, s);

    -- === projects ===
    EXECUTE format('DROP POLICY IF EXISTS dev_projects_all ON %1$I.projects;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_projects_all ON %1$I.projects;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_projects_all ON %1$I.projects;', s);
    EXECUTE format('DROP POLICY IF EXISTS projects_all_org ON %1$I.projects;', s);

    EXECUTE format($p$
      CREATE POLICY projects_all_org ON %1$I.projects
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    -- === prompts ===
    EXECUTE format('DROP POLICY IF EXISTS dev_prompts_all ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_prompts_all ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_prompts_all ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS prompts_all_org ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS dev_prompts_public ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_prompts_public ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_prompts_public ON %1$I.prompts;', s);
    EXECUTE format('DROP POLICY IF EXISTS prompts_public_active ON %1$I.prompts;', s);

    EXECUTE format($p$
      CREATE POLICY prompts_all_org ON %1$I.prompts
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY prompts_public_active ON %1$I.prompts
      FOR SELECT TO anon
      USING (status = 'active');
    $p$, s);

    -- === prompt_versions ===
    EXECUTE format('DROP POLICY IF EXISTS dev_versions_all ON %1$I.prompt_versions;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_versions_all ON %1$I.prompt_versions;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_versions_all ON %1$I.prompt_versions;', s);
    EXECUTE format('DROP POLICY IF EXISTS prompt_versions_all_org ON %1$I.prompt_versions;', s);

    EXECUTE format($p$
      CREATE POLICY prompt_versions_all_org ON %1$I.prompt_versions
      FOR ALL TO authenticated
      USING (prompt_id IN (SELECT id FROM %1$I.prompts WHERE org_id = %1$I.current_org_id()))
      WITH CHECK (prompt_id IN (SELECT id FROM %1$I.prompts WHERE org_id = %1$I.current_org_id()));
    $p$, s);

    -- === prompt_logs ===
    EXECUTE format('DROP POLICY IF EXISTS dev_logs_all ON %1$I.prompt_logs;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_logs_all ON %1$I.prompt_logs;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_logs_all ON %1$I.prompt_logs;', s);
    EXECUTE format('DROP POLICY IF EXISTS prompt_logs_all_org ON %1$I.prompt_logs;', s);

    EXECUTE format($p$
      CREATE POLICY prompt_logs_all_org ON %1$I.prompt_logs
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    -- === prompt_categories ===
    EXECUTE format('DROP POLICY IF EXISTS dev_categories_all ON %1$I.prompt_categories;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_categories_all ON %1$I.prompt_categories;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_categories_all ON %1$I.prompt_categories;', s);
    EXECUTE format('DROP POLICY IF EXISTS prompt_categories_all_org ON %1$I.prompt_categories;', s);

    EXECUTE format($p$
      CREATE POLICY prompt_categories_all_org ON %1$I.prompt_categories
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    -- === ab_tests ===
    EXECUTE format('DROP POLICY IF EXISTS dev_abtests_all ON %1$I.ab_tests;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_abtests_all ON %1$I.ab_tests;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_abtests_all ON %1$I.ab_tests;', s);
    EXECUTE format('DROP POLICY IF EXISTS ab_tests_all_org ON %1$I.ab_tests;', s);

    EXECUTE format($p$
      CREATE POLICY ab_tests_all_org ON %1$I.ab_tests
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    -- === team_invitations ===
    EXECUTE format('DROP POLICY IF EXISTS dev_invitations_all ON %1$I.team_invitations;', s);
    EXECUTE format('DROP POLICY IF EXISTS test_invitations_all ON %1$I.team_invitations;', s);
    EXECUTE format('DROP POLICY IF EXISTS prod_invitations_all ON %1$I.team_invitations;', s);
    EXECUTE format('DROP POLICY IF EXISTS team_invitations_all_org ON %1$I.team_invitations;', s);

    EXECUTE format($p$
      CREATE POLICY team_invitations_all_org ON %1$I.team_invitations
      FOR ALL TO authenticated
      USING (org_id = %1$I.current_org_id())
      WITH CHECK (org_id = %1$I.current_org_id());
    $p$, s);

    -- === admin_settings: admin only ===
    EXECUTE format('DROP POLICY IF EXISTS admin_settings_select ON %1$I.admin_settings;', s);
    EXECUTE format('DROP POLICY IF EXISTS admin_settings_modify ON %1$I.admin_settings;', s);
    EXECUTE format('DROP POLICY IF EXISTS admin_settings_read_all ON %1$I.admin_settings;', s);
    EXECUTE format('DROP POLICY IF EXISTS admin_settings_write_admin ON %1$I.admin_settings;', s);

    EXECUTE format($p$
      CREATE POLICY admin_settings_read_all ON %1$I.admin_settings
      FOR SELECT TO authenticated
      USING (true);
    $p$, s);

    EXECUTE format($p$
      CREATE POLICY admin_settings_write_admin ON %1$I.admin_settings
      FOR ALL TO authenticated
      USING (%1$I.current_role_name() = 'admin')
      WITH CHECK (%1$I.current_role_name() = 'admin');
    $p$, s);

  END LOOP;
END
$migration$;

-- Ensure PostgREST exposes all 3 schemas
NOTIFY pgrst, 'reload schema';
