import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PromptsClient } from "./PromptsClient";

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: prompts }, { data: categories }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("prompts")
      .select("*, prompt_categories(id, name, color)")
      .eq("project_id", id)
      .order("updated_at", { ascending: false }),
    supabase.from("prompt_categories").select("*").eq("project_id", id),
  ]);

  if (!project) notFound();

  return (
    <PromptsClient
      project={project}
      initialPrompts={prompts ?? []}
      categories={categories ?? []}
    />
  );
}
