// Unified AI client – server-side only
import { PROVIDERS, type ProviderId } from "./providers";
import { createServiceClient } from "@/lib/supabase/server";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

/** Reads active provider + model from admin_settings, falls back to SOKRATES */
export async function getActiveProvider(): Promise<{ provider: ProviderId; model: string }> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_provider")
      .single();

    if (data?.value && typeof data.value === "object") {
      const val = data.value as { provider?: string; model?: string };
      const provider = val.provider as ProviderId | undefined;
      const model = val.model;
      if (provider && model && PROVIDERS[provider]) {
        return { provider, model };
      }
    }
  } catch {
    // DB not reachable - use default
  }

  return { provider: "sokrates", model: PROVIDERS.sokrates.defaultModel };
}

/** Core chat completion – OpenAI-compatible for all 3 providers */
export async function chatCompletion(
  providerId: ProviderId,
  model: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string | null> {
  const provider = PROVIDERS[providerId];
  const apiKey = process.env[provider.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider.label}`);
  }

  // Sokrates is a local-network server – use shorter timeout to fail fast
  const timeoutMs = providerId === "sokrates" ? 10_000 : 30_000;

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 600,
      temperature: options.temperature ?? 0.3,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`${provider.label} API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? null;
}

/** Convenience: auto-selects active provider and runs chat.
 *  If the primary provider fails and it is sokrates (local network),
 *  automatically retries with groq as a fallback. */
export async function autoChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<{ text: string; provider: ProviderId; model: string }> {
  const { provider, model } = await getActiveProvider();

  try {
    const text = await chatCompletion(provider, model, messages, options);
    return { text: text ?? "Keine Antwort erhalten.", provider, model };
  } catch (primaryErr) {
    // Fallback to groq when sokrates (local network) is unreachable
    if (provider === "sokrates") {
      const groqKey = process.env["GROQ_API_KEY"];
      if (groqKey) {
        const fallbackModel = PROVIDERS.groq.defaultModel;
        const text = await chatCompletion("groq", fallbackModel, messages, options);
        return { text: text ?? "Keine Antwort erhalten.", provider: "groq", model: fallbackModel };
      }
    }
    throw primaryErr;
  }
}
