"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profil nicht gefunden" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const slug = slugify(name);

  const { error } = await supabase.from("projects").insert({
    org_id: profile.org_id,
    name,
    description: description || null,
    slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/projects");
  return { error: null };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/projects");
  return { error: null };
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase
    .from("projects")
    .update({ name, description: description || null })
    .eq("id", projectId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/projects");
  return { error: null };
}
