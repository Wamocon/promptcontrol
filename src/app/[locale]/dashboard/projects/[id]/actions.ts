"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createPrompt(projectId: string, formData: FormData) {
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
  const content = formData.get("content") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("category_id") as string;
  const slug = slugify(name) || name.toLowerCase().replace(/\s+/g, "-");

  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert({
      project_id: projectId,
      org_id: profile.org_id,
      name,
      slug,
      description: description || null,
      content: content || "",
      category_id: categoryId || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Create initial version
  await supabase.from("prompt_versions").insert({
    prompt_id: prompt.id,
    version: 1,
    content: content || "",
    change_note: "Erste Version",
    created_by: profile.id,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null, promptId: prompt.id };
}

export async function updatePrompt(promptId: string, projectId: string, formData: FormData, saveAsVersion: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const categoryId = formData.get("category_id") as string;
  const changeNote = formData.get("change_note") as string;

  const { data: currentPrompt } = await supabase
    .from("prompts")
    .select("current_version")
    .eq("id", promptId)
    .single();

  const newVersion = saveAsVersion ? (currentPrompt?.current_version ?? 1) + 1 : currentPrompt?.current_version ?? 1;

  const { error } = await supabase
    .from("prompts")
    .update({
      name,
      content,
      description: description || null,
      status,
      category_id: categoryId || null,
      current_version: newVersion,
    })
    .eq("id", promptId);

  if (error) return { error: error.message };

  if (saveAsVersion && profile) {
    await supabase.from("prompt_versions").insert({
      prompt_id: promptId,
      version: newVersion,
      content,
      change_note: changeNote || null,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function deletePrompt(promptId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prompts").delete().eq("id", promptId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function rollbackVersion(promptId: string, projectId: string, versionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  const { data: version } = await supabase.from("prompt_versions").select("*").eq("id", versionId).single();
  if (!version || !profile) return { error: "Version nicht gefunden" };

  const { data: prompt } = await supabase.from("prompts").select("current_version").eq("id", promptId).single();
  const newVersion = (prompt?.current_version ?? 1) + 1;

  await supabase.from("prompts").update({ content: version.content, current_version: newVersion }).eq("id", promptId);
  await supabase.from("prompt_versions").insert({
    prompt_id: promptId,
    version: newVersion,
    content: version.content,
    change_note: `Rollback zu Version ${version.version}`,
    created_by: profile.id,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function createCategory(projectId: string, name: string, color: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
  if (!profile) return { error: "Profil nicht gefunden" };

  const { error } = await supabase.from("prompt_categories").insert({
    org_id: profile.org_id,
    project_id: projectId,
    name,
    color,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}
