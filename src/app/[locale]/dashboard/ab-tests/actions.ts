"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAbTest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, organizations(plan)")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profil nicht gefunden" };

  const plan = (profile.organizations as { plan?: string } | null)?.plan;
  if (plan !== "pro") return { error: "A/B-Tests erfordern den Pro-Plan" };

  const name = formData.get("name") as string;
  const projectId = formData.get("project_id") as string;
  const promptAId = formData.get("prompt_a_id") as string;
  const promptBId = formData.get("prompt_b_id") as string;
  const weightA = parseInt(formData.get("weight_a") as string, 10) || 50;

  if (!name || !projectId || !promptAId || !promptBId) {
    return { error: "Alle Felder sind Pflichtfelder" };
  }
  if (promptAId === promptBId) {
    return { error: "Prompt A und Prompt B müssen unterschiedlich sein" };
  }

  const { error } = await supabase.from("ab_tests").insert({
    org_id: profile.org_id,
    project_id: projectId,
    name,
    prompt_a_id: promptAId,
    prompt_b_id: promptBId,
    weight_a: weightA,
    weight_b: 100 - weightA,
    active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/ab-tests");
  return { error: null };
}

export async function toggleAbTest(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ab_tests").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/ab-tests");
  return { error: null };
}

export async function deleteAbTest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ab_tests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/ab-tests");
  return { error: null };
}
