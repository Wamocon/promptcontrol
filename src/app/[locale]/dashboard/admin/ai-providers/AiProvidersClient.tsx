"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Bot, Zap, Save, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { setAiProviderSetting } from "../settings/actions";
import type { PublicProviderDef, ProviderId } from "@/lib/ai/providers";

interface Props {
  initialAiProvider: ProviderId;
  initialAiModel: string;
  providers: PublicProviderDef[];
}

const BADGE_COLORS: Record<string, string> = {
  WAMOCON: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  Cloud:   "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  Fast:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export function AiProvidersClient({ initialAiProvider, initialAiModel, providers }: Props) {
  const t = useTranslations("admin.aiProviders");
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(initialAiProvider);
  const [selectedModel, setSelectedModel] = useState(initialAiModel);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  function handleProviderChange(id: ProviderId) {
    setSelectedProvider(id);
    const provider = providers.find((p) => p.id === id);
    if (provider) setSelectedModel(provider.defaultModel);
    setSaveState("idle");
  }

  function handleSave() {
    setSaveState("saving");
    setErr(null);
    startTransition(async () => {
      const result = await setAiProviderSetting(selectedProvider, selectedModel);
      if (result.success) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 3000);
      } else {
        setSaveState("error");
        setErr(result.error ?? "Unbekannter Fehler");
      }
    });
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="h-5 w-5 text-indigo-500" />
        <h1 className="text-xl font-bold text-t1">{t("title")}</h1>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium">
          {t("active")}: {currentProvider?.label ?? selectedProvider}
        </span>
      </div>
      <p className="text-sm text-t3 mb-6">{t("description")}</p>

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3 mb-5">
          {providers.map((p) => {
            const isActive = selectedProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id as ProviderId)}
                className={`rounded-xl p-4 text-left transition-all border-2 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
                style={!isActive ? { background: "var(--panel-bg-subtle)", borderColor: "var(--panel-border)" } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm text-t1">{p.label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[p.badge] ?? ""}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-t3">{p.description}</p>
                {isActive && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Zap className="h-3 w-3" /> {t("selected")}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {currentProvider && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-t2 mb-2">{t("model")}</label>
            <div className="grid gap-2">
              {currentProvider.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all border ${
                    selectedModel === m.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                      : ""
                  }`}
                  style={selectedModel !== m.id ? { background: "var(--panel-bg-subtle)", borderColor: "var(--panel-border)" } : {}}
                >
                  <div className="text-left">
                    <p className="font-medium text-t1">{m.label}</p>
                    <p className="text-xs text-t3">{m.description}</p>
                  </div>
                  <code className="text-xs px-2 py-0.5 rounded-lg font-mono panel-subtle text-t3">{m.id}</code>
                </button>
              ))}
            </div>
          </div>
        )}

        {saveState === "error" && err && (
          <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {err}
          </div>
        )}

        <Button onClick={handleSave} disabled={isPending || saveState === "saving"} className="w-full">
          {saveState === "saved" ? (
            <><Check className="h-4 w-4" /> {t("saved")}</>
          ) : saveState === "saving" || isPending ? (
            "Speichern..."
          ) : (
            <><Save className="h-4 w-4" /> {t("save")}</>
          )}
        </Button>
      </Card>
    </div>
  );
}
