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

/** Returns true when the error looks like a transient rate-limit / server error
 *  that warrants a fallback attempt (HTTP 429, 500, 503, timeout). */
function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return /429|500|503|rate.?limit|overloaded|timeout|unavailable/i.test(msg);
}

/** Convenience: auto-selects active provider and runs chat.
 *  Cascade fallback strategy:
 *  1. Primary provider (from admin_settings or default SOKRATES)
 *  2. If primary fails with a transient error -> GroQ (if key is set)
 *  3. If GroQ is primary and fails -> OpenRouter (if key is set)
 *  This covers:
 *  - SOKRATES offline (local network)
 *  - OpenRouter 429 (free-tier rate limit)
 *  - Any cloud provider overload */
export async function autoChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<{ text: string; provider: ProviderId; model: string }> {
  const { provider, model } = await getActiveProvider();

  try {
    const text = await chatCompletion(provider, model, messages, options);
    return { text: text ?? "Keine Antwort erhalten.", provider, model };
  } catch (primaryErr) {
    if (!isTransientError(primaryErr)) throw primaryErr;

    // Try GroQ as first fallback (fast, reliable)
    if (provider !== "groq") {
      const groqKey = process.env["GROQ_API_KEY"];
      if (groqKey) {
        try {
          const fallbackModel = PROVIDERS.groq.defaultModel;
          const text = await chatCompletion("groq", fallbackModel, messages, options);
          return { text: text ?? "Keine Antwort erhalten.", provider: "groq", model: fallbackModel };
        } catch {
          // GroQ also failed - try OpenRouter next
        }
      }
    }

    // Try OpenRouter as second fallback
    if (provider !== "openrouter") {
      const orKey = process.env["OPENROUTER_API_KEY"];
      if (orKey) {
        // Use a paid model to avoid free-tier rate limits
        const orModel = "meta-llama/llama-3.3-70b-instruct";
        const text = await chatCompletion("openrouter", orModel, messages, options);
        return { text: text ?? "Keine Antwort erhalten.", provider: "openrouter", model: orModel };
      }
    }

    throw primaryErr;
  }
}
