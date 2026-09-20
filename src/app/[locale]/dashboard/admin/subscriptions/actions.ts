"use server";

import { createClient, createServiceClientSafe } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SubscriptionActionResult {
  success: boolean;
  error?: string;
}

const VALID_PLANS = ["free", "pro"];
const VALID_STATUSES = ["active", "cancelled", "past_due", "trialing"];

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
 * Plan/Status einer Organisation direkt setzen, ohne echte
 * Zahlungsabwicklung (kein Stripe angebunden). Laeuft ueber den
 * Service-Client, damit es unabhaengig von "orgs_update_admin"
 * (RLS: nur eigene Organisation) auch fuer andere Organisationen
 * funktioniert, sobald es mehr als eine gibt.
 */
export async function updateOrganizationPlan(
  orgId: string,
  plan: string,
  subscriptionStatus: string | null
): Promise<SubscriptionActionResult> {
  const authCheck = await requireAdmin();
  if (authCheck.error) return { success: false, error: authCheck.error };
  if (!VALID_PLANS.includes(plan)) return { success: false, error: "Ungueltiger Plan." };
  if (subscriptionStatus !== null && !VALID_STATUSES.includes(subscriptionStatus)) {
    return { success: false, error: "Ungueltiger Status." };
  }

  const supabase = await createServiceClientSafe();
  if (!supabase) return { success: false, error: "Supabase nicht konfiguriert." };

  const { error } = await supabase
    .from("organizations")
    .update({ plan, subscription_status: subscriptionStatus })
    .eq("id", orgId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/subscriptions");
  revalidatePath("/dashboard");
  return { success: true };
}
