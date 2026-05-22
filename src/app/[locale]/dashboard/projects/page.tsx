import { createClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, prompts(id)")
    .order("created_at", { ascending: false });

  const projectsWithCount = (projects ?? []).map((p) => ({
    ...p,
    prompt_count: Array.isArray(p.prompts) ? p.prompts.length : 0,
    prompts: undefined,
  }));

  return <ProjectsClient projects={projectsWithCount} />;
}
