"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/ai/providers";
import { revalidatePath } from "next/cache";

export interface AiProviderSetting {
  provider: ProviderId;
  model: string;
}

export async function getAiProviderSetting(): Promise<AiProviderSetting> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_provider")
      .single();

    if (data?.value) {
      const val = data.value as { provider?: string; model?: string };
      const provider = val.provider as ProviderId | undefined;
      if (provider && PROVIDERS[provider] && val.model) {
        return { provider, model: val.model };
      }
    }
  } catch {
    // DB not reachable
  }

  return { provider: "sokrates", model: PROVIDERS.sokrates.defaultModel };
}

export async function setAiProviderSetting(
  provider: ProviderId,
  model: string
): Promise<{ success: boolean; error?: string }> {
  if (!PROVIDERS[provider]) {
    return { success: false, error: "Ungültiger Anbieter" };
  }

  const validModels = PROVIDERS[provider].models.map((m) => m.id);
  if (!validModels.includes(model)) {
    return { success: false, error: "Ungültiges Modell für diesen Anbieter" };
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        { key: "ai_provider", value: { provider, model }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Datenbankfehler" };
  }
}
