-- =============================================
-- 20260531000004 — Ensure nikolaj.schefner@wamocon.com is admin in all 3 schemas
-- with WAMOCON GmbH org and plan='pro'. Idempotent.
-- =============================================

DO $migration$
DECLARE
  u_id UUID;
  s TEXT;
  schemas TEXT[] := ARRAY['promptcontrol_dev','promptcontrol_test','promptcontrol_prod'];
  org_id_var UUID;
BEGIN
  SELECT id INTO u_id FROM auth.users WHERE email = 'nikolaj.schefner@wamocon.com' LIMIT 1;
  IF u_id IS NULL THEN
    RAISE NOTICE 'Admin user not found in auth.users — skipping seed.';
    RETURN;
  END IF;

  FOREACH s IN ARRAY schemas LOOP
    -- Ensure WAMOCON org exists
    EXECUTE format($f$
      INSERT INTO %1$I.organizations (name, slug, plan, subscription_status)
      VALUES ('WAMOCON GmbH', 'wamocon', 'pro', 'active')
      ON CONFLICT (slug) DO UPDATE
        SET plan = EXCLUDED.plan,
            subscription_status = EXCLUDED.subscription_status,
            updated_at = now()
      RETURNING id;
    $f$, s) INTO org_id_var;

    -- Upsert profile
    EXECUTE format($f$
      INSERT INTO %1$I.profiles (user_id, org_id, name, email, role)
      VALUES ($1, $2, 'Nikolaj Schefner', 'nikolaj.schefner@wamocon.com', 'admin')
      ON CONFLICT (user_id) DO UPDATE
        SET org_id = EXCLUDED.org_id,
            role = 'admin',
            email = EXCLUDED.email,
            name = COALESCE(NULLIF(%1$I.profiles.name, ''), EXCLUDED.name),
            updated_at = now();
    $f$, s) USING u_id, org_id_var;
  END LOOP;
END
$migration$;
