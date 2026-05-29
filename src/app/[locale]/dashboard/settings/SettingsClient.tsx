"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Copy, Check, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface SettingsClientProps {
  profile: (Profile & { organizations?: { name?: string; plan?: string } | null }) | null;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const t = useTranslations("settings");
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
    <div className="p-6 max-w-2xl animate-fade-in-up">
      <h1 className="text-2xl font-bold text-white/90 mb-8">{t("title")}</h1>

      {/* Profile */}
      <div
        className="rounded-2xl border border-white/7 p-6 mb-5"
        style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)" }}
      >
        <h2 className="font-semibold text-white/80 mb-5">{t("profile")}</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Input id="name" name="name" label={t("name")} defaultValue={profile?.name ?? ""} />
          <Input id="email" name="email" label={t("email")} defaultValue={profile?.email ?? ""} disabled />
          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              {saved ? <><Check className="h-4 w-4" /> Gespeichert</> : t("save")}
            </Button>
          </div>
        </form>
      </div>

      {/* API Key */}
      <div
        className="rounded-2xl border border-white/7 p-6 mb-5"
        style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)" }}
      >
        <h2 className="font-semibold text-white/80 mb-1">{t("apiKey")}</h2>
        <p className="text-sm text-white/35 mb-5">{t("apiKeyDescription")}</p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 rounded-xl border border-white/8 px-3 py-2.5 text-xs font-mono text-white/60 truncate"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {apiKey}
          </code>
          <button
            onClick={handleCopyApiKey}
            className="rounded-xl border border-white/8 p-2.5 hover:bg-white/5 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/35" />}
          </button>
          <button
            onClick={handleRegenerateApiKey}
            className="rounded-xl border border-white/8 p-2.5 hover:bg-white/5 transition-colors"
            title={t("regenerate")}
          >
            <RefreshCw className="h-4 w-4 text-white/35" />
          </button>
        </div>
        <p className="mt-2.5 text-xs text-white/25">
          Verwendung: <code className="text-indigo-400">X-Api-Key: {apiKey.substring(0, 8)}...</code>
        </p>
      </div>

      {/* Subscription */}
      <div
        className="rounded-2xl border border-white/7 p-6"
        style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)" }}
      >
        <h2 className="font-semibold text-white/80 mb-5">{t("subscription")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/35">{t("currentPlan")}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-lg font-bold text-white/85 capitalize">{plan} Plan</span>
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
          <div
            className="mt-5 rounded-xl border border-indigo-500/20 p-4"
            style={{ background: "rgba(99,102,241,0.07)" }}
          >
            <p className="text-sm font-semibold text-indigo-300">Pro Plan - 20 € / Seat / Monat</p>
            <ul className="mt-2 space-y-1 text-xs text-indigo-400/80">
              {["Unbegrenzte Projekte", "A/B-Testing", "IDE-Integration (MCP)", "Unbegrenzte Log-Retention"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-indigo-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
