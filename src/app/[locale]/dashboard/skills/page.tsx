import { createClient } from "@/lib/supabase/server";
import { SkillsClient } from "./SkillsClient";
import type { Skill, SkillCategory, SkillFile } from "@/types";

export default async function SkillsPage() {
  const supabase = await createClient();

  const [{ data: skills }, { data: categories }] = await Promise.all([
    supabase
      .from("skills")
      .select("*, category:skill_categories(*), files:skill_files(*)")
      .order("updated_at", { ascending: false }),
    supabase.from("skill_categories").select("*").order("name"),
  ]);

  return (
    <SkillsClient
      initialSkills={(skills ?? []) as (Skill & { category: SkillCategory | null; files: SkillFile[] })[]}
      categories={(categories ?? []) as SkillCategory[]}
    />
  );
}
