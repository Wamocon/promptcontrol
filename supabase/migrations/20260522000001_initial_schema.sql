-- =============================================
-- ProCon (PromptControl) - Initial Database Schema
-- 3 environments: promptcontrol_dev, promptcontrol_test, promptcontrol_prod
-- =============================================

-- === CREATE SCHEMAS ===
CREATE SCHEMA IF NOT EXISTS promptcontrol_dev;
CREATE SCHEMA IF NOT EXISTS promptcontrol_test;
CREATE SCHEMA IF NOT EXISTS promptcontrol_prod;

-- Grant permissions
GRANT USAGE ON SCHEMA promptcontrol_dev TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_test TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA promptcontrol_prod TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_dev GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_test GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_prod GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_dev GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_test GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA promptcontrol_prod GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =============================================
-- DEV SCHEMA
-- =============================================
CREATE TABLE IF NOT EXISTS promptcontrol_dev.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES promptcontrol_dev.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')),
  avatar_url TEXT,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES promptcontrol_dev.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_dev.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES promptcontrol_dev.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES promptcontrol_dev.prompt_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES promptcontrol_dev.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES promptcontrol_dev.prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_note TEXT,
  created_by UUID NOT NULL REFERENCES promptcontrol_dev.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, version)
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES promptcontrol_dev.prompts(id) ON DELETE SET NULL,
  prompt_slug TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_dev.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_a_id UUID NOT NULL REFERENCES promptcontrol_dev.prompts(id),
  prompt_b_id UUID NOT NULL REFERENCES promptcontrol_dev.prompts(id),
  weight_a INTEGER NOT NULL DEFAULT 50 CHECK (weight_a BETWEEN 0 AND 100),
  weight_b INTEGER NOT NULL DEFAULT 50 CHECK (weight_b BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promptcontrol_dev.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES promptcontrol_dev.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, email)
);

-- Indexes dev
CREATE INDEX IF NOT EXISTS idx_dev_profiles_user_id ON promptcontrol_dev.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_profiles_org_id ON promptcontrol_dev.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_projects_org_id ON promptcontrol_dev.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_prompts_project_id ON promptcontrol_dev.prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_prompts_slug ON promptcontrol_dev.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_dev_logs_org_id ON promptcontrol_dev.prompt_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_logs_created_at ON promptcontrol_dev.prompt_logs(created_at);

-- Updated_at trigger dev
CREATE OR REPLACE FUNCTION promptcontrol_dev.set_updated_at()
RETURNS TRIGGER AS $trig$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $trig$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_dev_orgs_updated_at BEFORE UPDATE ON promptcontrol_dev.organizations FOR EACH ROW EXECUTE FUNCTION promptcontrol_dev.set_updated_at();
CREATE OR REPLACE TRIGGER trg_dev_profiles_updated_at BEFORE UPDATE ON promptcontrol_dev.profiles FOR EACH ROW EXECUTE FUNCTION promptcontrol_dev.set_updated_at();
CREATE OR REPLACE TRIGGER trg_dev_projects_updated_at BEFORE UPDATE ON promptcontrol_dev.projects FOR EACH ROW EXECUTE FUNCTION promptcontrol_dev.set_updated_at();
CREATE OR REPLACE TRIGGER trg_dev_prompts_updated_at BEFORE UPDATE ON promptcontrol_dev.prompts FOR EACH ROW EXECUTE FUNCTION promptcontrol_dev.set_updated_at();

-- RLS dev
ALTER TABLE promptcontrol_dev.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.prompt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_dev.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_profiles_select" ON promptcontrol_dev.profiles FOR SELECT TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_profiles_insert" ON promptcontrol_dev.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "dev_profiles_update" ON promptcontrol_dev.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "dev_orgs_select" ON promptcontrol_dev.organizations FOR SELECT TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_orgs_insert" ON promptcontrol_dev.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dev_orgs_update" ON promptcontrol_dev.organizations FOR UPDATE TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "dev_projects_all" ON promptcontrol_dev.projects FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_categories_all" ON promptcontrol_dev.prompt_categories FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_prompts_all" ON promptcontrol_dev.prompts FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_prompts_public" ON promptcontrol_dev.prompts FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "dev_versions_all" ON promptcontrol_dev.prompt_versions FOR ALL TO authenticated USING (prompt_id IN (SELECT p.id FROM promptcontrol_dev.prompts p JOIN promptcontrol_dev.profiles pr ON pr.org_id = p.org_id WHERE pr.user_id = auth.uid()));
CREATE POLICY "dev_logs_all" ON promptcontrol_dev.prompt_logs FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_abtests_all" ON promptcontrol_dev.ab_tests FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));
CREATE POLICY "dev_invitations_all" ON promptcontrol_dev.team_invitations FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_dev.profiles WHERE user_id = auth.uid()));

-- =============================================
-- TEST SCHEMA
-- =============================================
CREATE TABLE IF NOT EXISTS promptcontrol_test.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')), stripe_customer_id TEXT, stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES promptcontrol_test.organizations(id) ON DELETE SET NULL, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')), avatar_url TEXT,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, slug TEXT NOT NULL, created_by UUID NOT NULL REFERENCES promptcontrol_test.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(org_id, slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_test.projects(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES promptcontrol_test.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, slug TEXT NOT NULL, description TEXT,
  content TEXT NOT NULL DEFAULT '', category_id UUID REFERENCES promptcontrol_test.prompt_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')), current_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES promptcontrol_test.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(project_id, slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), prompt_id UUID NOT NULL REFERENCES promptcontrol_test.prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL, content TEXT NOT NULL, change_note TEXT, created_by UUID NOT NULL REFERENCES promptcontrol_test.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(prompt_id, version)
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES promptcontrol_test.prompts(id) ON DELETE SET NULL, prompt_slug TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_test.projects(id) ON DELETE CASCADE, name TEXT NOT NULL,
  prompt_a_id UUID NOT NULL REFERENCES promptcontrol_test.prompts(id), prompt_b_id UUID NOT NULL REFERENCES promptcontrol_test.prompts(id),
  weight_a INTEGER NOT NULL DEFAULT 50 CHECK (weight_a BETWEEN 0 AND 100), weight_b INTEGER NOT NULL DEFAULT 50 CHECK (weight_b BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_test.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_test.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'), expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(org_id, email)
);

ALTER TABLE promptcontrol_test.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.prompt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_test.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION promptcontrol_test.set_updated_at()
RETURNS TRIGGER AS $trig$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $trig$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER trg_test_orgs_updated_at BEFORE UPDATE ON promptcontrol_test.organizations FOR EACH ROW EXECUTE FUNCTION promptcontrol_test.set_updated_at();
CREATE OR REPLACE TRIGGER trg_test_profiles_updated_at BEFORE UPDATE ON promptcontrol_test.profiles FOR EACH ROW EXECUTE FUNCTION promptcontrol_test.set_updated_at();
CREATE OR REPLACE TRIGGER trg_test_projects_updated_at BEFORE UPDATE ON promptcontrol_test.projects FOR EACH ROW EXECUTE FUNCTION promptcontrol_test.set_updated_at();
CREATE OR REPLACE TRIGGER trg_test_prompts_updated_at BEFORE UPDATE ON promptcontrol_test.prompts FOR EACH ROW EXECUTE FUNCTION promptcontrol_test.set_updated_at();

CREATE POLICY "test_profiles_select" ON promptcontrol_test.profiles FOR SELECT TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_profiles_insert" ON promptcontrol_test.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "test_profiles_update" ON promptcontrol_test.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "test_orgs_select" ON promptcontrol_test.organizations FOR SELECT TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_orgs_insert" ON promptcontrol_test.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "test_orgs_update" ON promptcontrol_test.organizations FOR UPDATE TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "test_projects_all" ON promptcontrol_test.projects FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_categories_all" ON promptcontrol_test.prompt_categories FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_prompts_all" ON promptcontrol_test.prompts FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_prompts_public" ON promptcontrol_test.prompts FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "test_versions_all" ON promptcontrol_test.prompt_versions FOR ALL TO authenticated USING (prompt_id IN (SELECT p.id FROM promptcontrol_test.prompts p JOIN promptcontrol_test.profiles pr ON pr.org_id = p.org_id WHERE pr.user_id = auth.uid()));
CREATE POLICY "test_logs_all" ON promptcontrol_test.prompt_logs FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_abtests_all" ON promptcontrol_test.ab_tests FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));
CREATE POLICY "test_invitations_all" ON promptcontrol_test.team_invitations FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_test.profiles WHERE user_id = auth.uid()));

-- =============================================
-- PROD SCHEMA
-- =============================================
CREATE TABLE IF NOT EXISTS promptcontrol_prod.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')), stripe_customer_id TEXT, stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES promptcontrol_prod.organizations(id) ON DELETE SET NULL, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')), avatar_url TEXT,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, slug TEXT NOT NULL, created_by UUID NOT NULL REFERENCES promptcontrol_prod.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(org_id, slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_prod.projects(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES promptcontrol_prod.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, slug TEXT NOT NULL, description TEXT,
  content TEXT NOT NULL DEFAULT '', category_id UUID REFERENCES promptcontrol_prod.prompt_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')), current_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES promptcontrol_prod.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(project_id, slug)
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), prompt_id UUID NOT NULL REFERENCES promptcontrol_prod.prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL, content TEXT NOT NULL, change_note TEXT, created_by UUID NOT NULL REFERENCES promptcontrol_prod.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(prompt_id, version)
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES promptcontrol_prod.prompts(id) ON DELETE SET NULL, prompt_slug TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES promptcontrol_prod.projects(id) ON DELETE CASCADE, name TEXT NOT NULL,
  prompt_a_id UUID NOT NULL REFERENCES promptcontrol_prod.prompts(id), prompt_b_id UUID NOT NULL REFERENCES promptcontrol_prod.prompts(id),
  weight_a INTEGER NOT NULL DEFAULT 50 CHECK (weight_a BETWEEN 0 AND 100), weight_b INTEGER NOT NULL DEFAULT 50 CHECK (weight_b BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promptcontrol_prod.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES promptcontrol_prod.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'pm', 'developer', 'trainee')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'), expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(org_id, email)
);

ALTER TABLE promptcontrol_prod.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.prompt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptcontrol_prod.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION promptcontrol_prod.set_updated_at()
RETURNS TRIGGER AS $trig$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $trig$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER trg_prod_orgs_updated_at BEFORE UPDATE ON promptcontrol_prod.organizations FOR EACH ROW EXECUTE FUNCTION promptcontrol_prod.set_updated_at();
CREATE OR REPLACE TRIGGER trg_prod_profiles_updated_at BEFORE UPDATE ON promptcontrol_prod.profiles FOR EACH ROW EXECUTE FUNCTION promptcontrol_prod.set_updated_at();
CREATE OR REPLACE TRIGGER trg_prod_projects_updated_at BEFORE UPDATE ON promptcontrol_prod.projects FOR EACH ROW EXECUTE FUNCTION promptcontrol_prod.set_updated_at();
CREATE OR REPLACE TRIGGER trg_prod_prompts_updated_at BEFORE UPDATE ON promptcontrol_prod.prompts FOR EACH ROW EXECUTE FUNCTION promptcontrol_prod.set_updated_at();

CREATE POLICY "prod_profiles_select" ON promptcontrol_prod.profiles FOR SELECT TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_profiles_insert" ON promptcontrol_prod.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prod_profiles_update" ON promptcontrol_prod.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prod_orgs_select" ON promptcontrol_prod.organizations FOR SELECT TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_orgs_insert" ON promptcontrol_prod.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prod_orgs_update" ON promptcontrol_prod.organizations FOR UPDATE TO authenticated USING (id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "prod_projects_all" ON promptcontrol_prod.projects FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_categories_all" ON promptcontrol_prod.prompt_categories FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_prompts_all" ON promptcontrol_prod.prompts FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_prompts_public" ON promptcontrol_prod.prompts FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "prod_versions_all" ON promptcontrol_prod.prompt_versions FOR ALL TO authenticated USING (prompt_id IN (SELECT p.id FROM promptcontrol_prod.prompts p JOIN promptcontrol_prod.profiles pr ON pr.org_id = p.org_id WHERE pr.user_id = auth.uid()));
CREATE POLICY "prod_logs_all" ON promptcontrol_prod.prompt_logs FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_abtests_all" ON promptcontrol_prod.ab_tests FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid())) WITH CHECK (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
CREATE POLICY "prod_invitations_all" ON promptcontrol_prod.team_invitations FOR ALL TO authenticated USING (org_id IN (SELECT org_id FROM promptcontrol_prod.profiles WHERE user_id = auth.uid()));
