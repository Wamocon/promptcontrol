-- =============================================
-- Admin Settings table for all schemas
-- Stores key/value pairs for global app config
-- including the active AI provider setting
-- =============================================

-- === DEV ===
CREATE TABLE IF NOT EXISTS promptcontrol_dev.admin_settings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT        NOT NULL UNIQUE,
  value        JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default AI provider
INSERT INTO promptcontrol_dev.admin_settings (key, value)
VALUES ('ai_provider', '{"provider": "sokrates", "model": "qwen3.6-35b"}')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE promptcontrol_dev.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_settings_select" ON promptcontrol_dev.admin_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_settings_modify" ON promptcontrol_dev.admin_settings
  FOR ALL TO service_role USING (true);

-- === TEST ===
CREATE TABLE IF NOT EXISTS promptcontrol_test.admin_settings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT        NOT NULL UNIQUE,
  value        JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO promptcontrol_test.admin_settings (key, value)
VALUES ('ai_provider', '{"provider": "sokrates", "model": "qwen3.6-35b"}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE promptcontrol_test.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_settings_select" ON promptcontrol_test.admin_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_settings_modify" ON promptcontrol_test.admin_settings
  FOR ALL TO service_role USING (true);

-- === PROD ===
CREATE TABLE IF NOT EXISTS promptcontrol_prod.admin_settings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT        NOT NULL UNIQUE,
  value        JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO promptcontrol_prod.admin_settings (key, value)
VALUES ('ai_provider', '{"provider": "sokrates", "model": "qwen3.6-35b"}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE promptcontrol_prod.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_settings_select" ON promptcontrol_prod.admin_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_settings_modify" ON promptcontrol_prod.admin_settings
  FOR ALL TO service_role USING (true);
