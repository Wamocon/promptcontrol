-- =============================================================
-- 20260531000002_seed_admin_pro
-- -------------------------------------------------------------
-- Ensures the dedicated admin user (nikolaj.schefner@wamocon.com)
-- is provisioned in every schema with:
--   - a WAMOCON organisation (idempotent on slug)
--   - plan = 'pro' and subscription_status = 'active'
--   - an admin-role profile linking the auth.users row to the org
--
-- Safe to re-run: every INSERT uses ON CONFLICT to either
-- short-circuit or update. If the auth user does not exist yet
-- (e.g. fresh local Supabase), the block exits silently.
-- =============================================================

DO $seed$
DECLARE
  admin_uid UUID;
  s TEXT;
  org_uuid UUID;
BEGIN
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE lower(email) = 'nikolaj.schefner@wamocon.com'
  LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE NOTICE 'Admin user nikolaj.schefner@wamocon.com not found in auth.users; skipping seed.';
    RETURN;
  END IF;

  FOREACH s IN ARRAY ARRAY['promptcontrol_dev', 'promptcontrol_test', 'promptcontrol_prod']
  LOOP
    -- Upsert org by slug
    EXECUTE format($q$
      INSERT INTO %I.organizations (name, slug, plan, subscription_status)
      VALUES ('WAMOCON', 'wamocon', 'pro', 'active')
      ON CONFLICT (slug)
      DO UPDATE SET plan = 'pro', subscription_status = 'active', updated_at = now()
      RETURNING id
    $q$, s) INTO org_uuid;

    -- Upsert profile for the admin user
    EXECUTE format($q$
      INSERT INTO %I.profiles (user_id, org_id, name, email, role)
      VALUES ($1, $2, 'Nikolaj Schefner', 'nikolaj.schefner@wamocon.com', 'admin')
      ON CONFLICT (user_id)
      DO UPDATE SET org_id = EXCLUDED.org_id, role = 'admin', updated_at = now()
    $q$, s) USING admin_uid, org_uuid;
  END LOOP;
END
$seed$;
