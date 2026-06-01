import { AdminSettingsClient } from "./AdminSettingsClient";
import { getAiProviderSetting } from "./actions";
import { PUBLIC_PROVIDERS } from "@/lib/ai/providers";

export default async function AdminSettingsPage() {
  const aiSetting = await getAiProviderSetting();

  return (
    <AdminSettingsClient
      initialAiProvider={aiSetting.provider}
      initialAiModel={aiSetting.model}
      providers={PUBLIC_PROVIDERS}
    />
  );
}
