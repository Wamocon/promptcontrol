"use server";

import { createClient as createServerClient, createServiceClientSafe } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";

export interface ProfileActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function updateProfileName(name: string): Promise<ProfileActionResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Nicht angemeldet." };

    const { error } = await supabase.from("profiles").update({ name }).eq("user_id", user.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export async function changePassword(newPassword: string): Promise<ProfileActionResult> {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export async function regenerateApiKey(): Promise<ProfileActionResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Nicht angemeldet." };

    const newKey = randomBytes(32).toString("hex");
    const { error } = await supabase.from("profiles").update({ api_key: newKey }).eq("user_id", user.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/profile");
    return { success: true, data: { apiKey: newKey } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export async function exportUserData(): Promise<ProfileActionResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Nicht angemeldet." };

    const [{ data: profile }, { data: prompts }, { data: logs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("prompts").select("*").eq("created_by", user.id),
      supabase.from("prompt_logs").select("*").eq("user_id", user.id).limit(1000),
    ]);

    return {
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile,
        prompts: prompts ?? [],
        recentLogs: logs ?? [],
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export async function deleteAccount(): Promise<ProfileActionResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Nicht angemeldet." };

    const service = await createServiceClientSafe();
    if (!service) {
      return { success: false, error: "Kontolöschung erfordert SUPABASE_SERVICE_ROLE_KEY. Bitte support@procon.app kontaktieren." };
    }
    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}
