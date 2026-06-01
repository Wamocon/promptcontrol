// AI Provider definitions – server-side only (no NEXT_PUBLIC_ prefix)

export type ProviderId = "sokrates" | "openrouter" | "groq";

export interface ModelDef {
  id: string;
  label: string;
  description: string;
}

export interface ProviderDef {
  id: ProviderId;
  label: string;
  description: string;
  badge: string;
  baseUrl: string;
  apiKeyEnv: string;
  models: ModelDef[];
  defaultModel: string;
  /** Extra HTTP headers required by this provider */
  extraHeaders?: Record<string, string>;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  sokrates: {
    id: "sokrates",
    label: "SOKRATES",
    description: "Selbst gehostete WAMOCON KI via LiteLLM (lokales Netzwerk)",
    badge: "WAMOCON",
    baseUrl: process.env.SOKRATES_BASE_URL ?? "http://192.168.178.75:4000/v1",
    apiKeyEnv: "SOKRATES_API_KEY",
    models: [
      { id: "qwen3.6-35b",  label: "Qwen 3.6 35B",   description: "Allgemein, schnell" },
      { id: "qwen3.5-122b", label: "Qwen 3.5 122B",   description: "Beste Qualität (Spark 2)" },
      { id: "glm4-flash",   label: "GLM-4 Flash",     description: "Schnellste, einfache Aufgaben" },
      { id: "gemma4-31b",   label: "Gemma 4 31B",     description: "Alternatives Allzweckmodell" },
      { id: "laaj-judge",   label: "LAAJ Judge",       description: "KI-Ausgabequalität (fine-tuned)" },
    ],
    defaultModel: "qwen3.6-35b",
  },

  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    description: "Zugang zu GPT-4o, Llama und weiteren Topmodellen",
    badge: "Cloud",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    extraHeaders: {
      "HTTP-Referer": "https://procon.wamocon.de",
      "X-Title": "ProCon - Prompt Management",
    },
    models: [
      { id: "google/gemma-4-31b-it:free",          label: "Gemma 4 31B (Free)",  description: "Kostenlos" },
      { id: "openai/gpt-4o-mini",                   label: "GPT-4o Mini",         description: "Schnell & günstig" },
      { id: "openai/gpt-4o",                        label: "GPT-4o",              description: "Beste OpenAI Qualität" },
      { id: "meta-llama/llama-3.3-70b-instruct",    label: "Llama 3.3 70B",       description: "Open-Source Alternative" },
    ],
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
  },

  groq: {
    id: "groq",
    label: "GroQ",
    description: "Extrem schnelle Inferenz auf dedizierten LPU-Chips",
    badge: "Fast",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",       description: "Vielseitig, sehr schnell" },
      { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B Instant", description: "Blitzschnell, einfache Tasks" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
  },
};

export const PROVIDER_LIST: ProviderDef[] = Object.values(PROVIDERS);

/** Safe provider config for client components (no API keys, no baseUrl) */
export interface PublicProviderDef {
  id: ProviderId;
  label: string;
  description: string;
  badge: string;
  models: ModelDef[];
  defaultModel: string;
}

export function toPublicProvider(p: ProviderDef): PublicProviderDef {
  return {
    id: p.id,
    label: p.label,
    description: p.description,
    badge: p.badge,
    models: p.models,
    defaultModel: p.defaultModel,
  };
}

export const PUBLIC_PROVIDERS: PublicProviderDef[] = PROVIDER_LIST.map(toPublicProvider);
