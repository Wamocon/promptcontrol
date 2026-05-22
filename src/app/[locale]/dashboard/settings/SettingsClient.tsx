"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { Sun, Moon, Monitor, Copy, Check, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface SettingsClientProps {
  profile: (Profile & { organizations?: { name?: string; plan?: string } | null }) | null;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(profile?.api_key ?? "");

  const plan = profile?.organizations?.plan ?? "free";

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ name })
        .eq("id", profile!.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function handleCopyApiKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerateApiKey() {
    const supabase = createClient();
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await supabase.from("profiles").update({ api_key: newKey }).eq("id", profile!.id);
    setApiKey(newKey);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">{t("title")}</h1>

      {/* Profile */}
      <Card className="mb-6">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t("profile")}</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label={t("name")}
            defaultValue={profile?.name ?? ""}
          />
          <Input
            id="email"
            name="email"
            label={t("email")}
            defaultValue={profile?.email ?? ""}
            disabled
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              {saved ? <><Check className="h-4 w-4" /> Gespeichert</> : t("save")}
            </Button>
          </div>
        </form>
      </Card>

      {/* Theme */}
      <Card className="mb-6">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t("theme")}</h2>
        <div className="flex gap-3">
          {[
            { value: "light", icon: Sun, label: t("light") },
            { value: "dark", icon: Moon, label: t("dark") },
            { value: "system", icon: Monitor, label: t("system") },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${theme === value ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300" : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* API Key */}
      <Card className="mb-6">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t("apiKey")}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{t("apiKeyDescription")}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 truncate">
            {apiKey}
          </code>
          <button
            onClick={handleCopyApiKey}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-zinc-500" />}
          </button>
          <button
            onClick={handleRegenerateApiKey}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title={t("regenerate")}
          >
            <RefreshCw className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Verwendung: <code className="text-indigo-600">X-Api-Key: {apiKey.substring(0, 8)}...</code>
        </p>
      </Card>

      {/* Subscription */}
      <Card>
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t("subscription")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">{t("currentPlan")}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">{plan} Plan</span>
              {plan === "pro" && <Badge variant="pro">Pro</Badge>}
            </div>
          </div>
          {plan === "free" && (
            <Button>
              <Zap className="h-4 w-4" />
              {t("upgrade")}
            </Button>
          )}
        </div>
        {plan === "free" && (
          <div className="mt-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-indigo-900/20 dark:to-purple-900/20">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Pro Plan - 20 € / Seat / Monat</p>
            <ul className="mt-2 space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
              {["Unbegrenzte Projekte", "A/B-Testing", "IDE-Integration (MCP)", "Unbegrenzte Log-Retention"].map((f) => (
                <li key={f} className="flex items-center gap-1">✓ {f}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
