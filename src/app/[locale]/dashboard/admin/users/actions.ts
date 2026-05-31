"use server";

import { createServiceClientSafe } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Deactivate a user by banning them in Supabase Auth for ~100 years.
 * Reversible via activateUser.
 */
export async function deactivateUser(userId: string): Promise<UserActionResult> {
  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "Nutzer deaktiviert." };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export async function activateUser(userId: string): Promise<UserActionResult> {
  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "Nutzer aktiviert." };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

/**
 * Trigger a password reset by sending an email link.
 */
export async function resetUserPassword(email: string): Promise<UserActionResult> {
  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Reset-Link gesendet." };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}
