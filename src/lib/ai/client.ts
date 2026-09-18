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
  /** Overrides the default per-provider timeout (ms). Use for calls with a
   *  large maxTokens where generation legitimately takes longer than the
   *  default fail-fast window. */
  timeoutMs?: number;
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

/** Parses a provider's rate-limit reset hint into a wait duration (ms).
 *  Tries the standard `Retry-After` header (seconds) first, then GroQ's
 *  `x-ratelimit-reset-tokens`/`-requests` format ("2m52.8s", "600ms", "7.66s"). */
function parseRetryDelayMs(response: Response): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const sec = Number(retryAfter);
    if (!Number.isNaN(sec) && sec > 0) return Math.min(sec * 1000, 65_000);
  }

  const reset =
    response.headers.get("x-ratelimit-reset-tokens") ??
    response.headers.get("x-ratelimit-reset-requests");
  if (reset) {
    const match = reset.match(/^(?:(\d+)m)?(?:([\d.]+)s)?(?:([\d.]+)ms)?$/);
    if (match) {
      const minutes = Number(match[1] ?? 0);
      const seconds = Number(match[2] ?? 0);
      const millis = Number(match[3] ?? 0);
      const totalMs = minutes * 60_000 + seconds * 1000 + millis;
      if (totalMs > 0) return Math.min(totalMs, 65_000);
    }
  }

  return 5_000;
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

  // Sokrates is a local-network server – use shorter timeout to fail fast,
  // unless the caller explicitly needs more room (e.g. large maxTokens).
  const timeoutMs = options.timeoutMs ?? (providerId === "sokrates" ? 10_000 : 30_000);

  const doRequest = () =>
    fetch(`${provider.baseUrl}/chat/completions`, {
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

  let response = await doRequest();

  // Rate-limited: wait for the provider's own reset hint and retry once,
  // instead of immediately cascading to a possibly-unavailable fallback.
  if (response.status === 429) {
    const delayMs = parseRetryDelayMs(response);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await doRequest();
  }

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
  return /429|500|503|rate.?limit|overloaded|timeout|unavailable|no_db_connection|no connected db/i.test(msg);
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
        try {
          // Free-tier model: the configured OpenRouter account has no paid
          // credits, so a paid model would fail with HTTP 402.
          const orModel = PROVIDERS.openrouter.defaultModel;
          const text = await chatCompletion("openrouter", orModel, messages, options);
          return { text: text ?? "Keine Antwort erhalten.", provider: "openrouter", model: orModel };
        } catch {
          // OpenRouter also failed - surface the original, most informative error below
        }
      }
    }

    throw primaryErr;
  }
}
