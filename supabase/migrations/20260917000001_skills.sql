-- =============================================
-- Skills-Bibliothek: skills, skill_categories, skill_versions, skill_files
-- Geschwister-Feature zu "prompts", aber org-weit statt projektgebunden.
-- =============================================

DO $skills$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['promptcontrol_dev','promptcontrol_test','promptcontrol_prod']
  LOOP
    EXECUTE format($q$
      CREATE TABLE IF NOT EXISTS %1$I.skill_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES %1$I.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(org_id, name)
      );

      CREATE TABLE IF NOT EXISTS %1$I.skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES %1$I.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        category_id UUID REFERENCES %1$I.skill_categories(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','archived')),
        current_version INTEGER NOT NULL DEFAULT 1,
        created_by UUID NOT NULL REFERENCES %1$I.profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(org_id, slug)
      );

      CREATE TABLE IF NOT EXISTS %1$I.skill_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_id UUID NOT NULL REFERENCES %1$I.skills(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        change_note TEXT,
        created_by UUID NOT NULL REFERENCES %1$I.profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(skill_id, version)
      );

      CREATE TABLE IF NOT EXISTS %1$I.skill_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_id UUID NOT NULL REFERENCES %1$I.skills(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        size_bytes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(skill_id, path)
      );

      CREATE INDEX IF NOT EXISTS idx_%2$s_skills_org_id ON %1$I.skills(org_id);
      CREATE INDEX IF NOT EXISTS idx_%2$s_skills_slug ON %1$I.skills(slug);
      CREATE INDEX IF NOT EXISTS idx_%2$s_skill_versions_skill_id ON %1$I.skill_versions(skill_id);
      CREATE INDEX IF NOT EXISTS idx_%2$s_skill_files_skill_id ON %1$I.skill_files(skill_id);

      CREATE OR REPLACE TRIGGER trg_%2$s_skills_updated_at
        BEFORE UPDATE ON %1$I.skills
        FOR EACH ROW EXECUTE FUNCTION %1$I.set_updated_at();
    $q$, s, replace(s, 'promptcontrol_', ''));

    -- RLS + Policies (current_org_id() helper existiert je Schema bereits seit 20260531000003)
    EXECUTE format($q$
      ALTER TABLE %1$I.skill_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE %1$I.skills ENABLE ROW LEVEL SECURITY;
      ALTER TABLE %1$I.skill_versions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE %1$I.skill_files ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS skill_categories_all_org ON %1$I.skill_categories;
      CREATE POLICY skill_categories_all_org ON %1$I.skill_categories FOR ALL TO authenticated
        USING (org_id = %1$I.current_org_id()) WITH CHECK (org_id = %1$I.current_org_id());

      DROP POLICY IF EXISTS skills_all_org ON %1$I.skills;
      CREATE POLICY skills_all_org ON %1$I.skills FOR ALL TO authenticated
        USING (org_id = %1$I.current_org_id()) WITH CHECK (org_id = %1$I.current_org_id());
      DROP POLICY IF EXISTS skills_public ON %1$I.skills;
      CREATE POLICY skills_public ON %1$I.skills FOR SELECT TO anon USING (status = 'active');

      DROP POLICY IF EXISTS skill_versions_all_org ON %1$I.skill_versions;
      CREATE POLICY skill_versions_all_org ON %1$I.skill_versions FOR ALL TO authenticated
        USING (skill_id IN (SELECT id FROM %1$I.skills WHERE org_id = %1$I.current_org_id()));

      DROP POLICY IF EXISTS skill_files_all_org ON %1$I.skill_files;
      CREATE POLICY skill_files_all_org ON %1$I.skill_files FOR ALL TO authenticated
        USING (skill_id IN (SELECT id FROM %1$I.skills WHERE org_id = %1$I.current_org_id()));
    $q$, s);
  END LOOP;
END $skills$;

-- =============================================
-- Storage-Bucket fuer Skill-Zusatzdateien (Scripts, Vorlagen, Bilder).
-- Bucket bleibt privat, Zugriff laeuft ausschliesslich ueber den
-- Service-Role-Client in Server Actions/API-Routes (siehe skills/actions.ts),
-- nicht ueber Storage-RLS-Policies.
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('skill-files', 'skill-files', false)
ON CONFLICT (id) DO NOTHING;
