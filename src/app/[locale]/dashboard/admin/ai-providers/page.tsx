import { AiProvidersClient } from "./AiProvidersClient";
import { getAiProviderSetting } from "../settings/actions";
import { PUBLIC_PROVIDERS } from "@/lib/ai/providers";

export default async function AdminAiProvidersPage() {
  const aiSetting = await getAiProviderSetting();
  return (
    <AiProvidersClient
      initialAiProvider={aiSetting.provider}
      initialAiModel={aiSetting.model}
      providers={PUBLIC_PROVIDERS}
    />
  );
}
