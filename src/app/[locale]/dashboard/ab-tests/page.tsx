import { createClient } from "@/lib/supabase/server";
import { AbTestsClient } from "./AbTestsClient";

export default async function AbTestsPage() {
  const supabase = await createClient();

  const [{ data: abTests }, { data: projects }, { data: prompts }] = await Promise.all([
    supabase
      .from("ab_tests")
      .select("*, prompt_a:prompts!ab_tests_prompt_a_id_fkey(id,name,slug), prompt_b:prompts!ab_tests_prompt_b_id_fkey(id,name,slug)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("prompts").select("id, name, slug, project_id, status").eq("status", "active").order("name"),
  ]);

  return (
    <AbTestsClient
      abTests={abTests ?? []}
      projects={projects ?? []}
      prompts={prompts ?? []}
    />
  );
}
