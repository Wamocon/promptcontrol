"use server";

import { createClient, createServiceClientSafe } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const VALID_ROLES = ["admin", "pm", "developer", "trainee"];

/**
 * Diese Server Actions sind ueber ihre Next.js-Action-ID direkt aufrufbar,
 * unabhaengig davon, ob die aufrufende UI (Admin-Bereich) tatsaechlich nur
 * fuer Admins sichtbar ist. Jede Funktion prueft die Berechtigung deshalb
 * hier selbst, statt sich auf die Client-seitige Sichtbarkeit zu verlassen.
 */
async function requireAdmin(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Nur Admins duerfen diese Aktion ausfuehren." };
  }
  return { error: null };
}

/**
 * Deactivate a user by banning them in Supabase Auth for ~100 years.
 * Reversible via activateUser.
 */
export async function deactivateUser(userId: string): Promise<UserActionResult> {
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };

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
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };

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
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };

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

/**
 * Rolle eines Nutzers aendern. Laeuft ueber den Service-Client, weil die
 * RLS-Policy "profiles_update_self" nur Aenderungen am eigenen Profil
 * erlaubt (USING user_id = auth.uid()) - ein Admin kaeme ueber den
 * normalen Client bei fremden Profilen sonst nicht durch (0 Zeilen
 * betroffen, aber kein Fehler, daher bisher unbemerkt wirkungslos).
 */
export async function updateUserRole(profileId: string, role: string): Promise<UserActionResult> {
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };
  if (!VALID_ROLES.includes(role)) return { success: false, error: "Ungueltige Rolle." };

  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Organisation eines Nutzers aendern (z.B. um eine versehentlich bei der
 * Registrierung angelegte Organisation zu korrigieren, ohne manuell in
 * der Datenbank arbeiten zu muessen).
 */
export async function updateUserOrganization(profileId: string, orgId: string): Promise<UserActionResult> {
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };

  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  const { error } = await supabase.from("profiles").update({ org_id: orgId }).eq("id", profileId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Profil eines Nutzers loeschen. Laeuft ueber den Service-Client, weil
 * fuer "profiles" ueberhaupt keine DELETE-Policy existiert - der bisherige
 * Loeschen-Button im UI war dadurch komplett wirkungslos (RLS blockiert
 * die Zeile stillschweigend, kein Fehler, der Nutzer blieb bestehen).
 */
export async function deleteUserProfile(profileId: string): Promise<UserActionResult> {
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };

  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
