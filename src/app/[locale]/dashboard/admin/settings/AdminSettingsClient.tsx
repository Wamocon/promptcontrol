"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Settings, ChevronLeft, Bell, Shield, Globe, Database, Save, Check, Bot, Zap, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setAiProviderSetting } from "./actions";
import type { PublicProviderDef } from "@/lib/ai/providers";
import type { ProviderId } from "@/lib/ai/providers";

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{label}</p>
        {description && <p className="text-xs" style={{ color: "var(--text-3)" }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

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

export function AdminSettingsClient({ initialAiProvider, initialAiModel, providers }: Props) {
  const t = useTranslations("admin");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // AI Provider state
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(initialAiProvider);
  const [selectedModel, setSelectedModel] = useState(initialAiModel);
  const [aiSaveState, setAiSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  function handleProviderChange(id: ProviderId) {
    setSelectedProvider(id);
    const provider = providers.find((p) => p.id === id);
    if (provider) setSelectedModel(provider.defaultModel);
    setAiSaveState("idle");
  }

  function handleSaveAiProvider() {
    setAiSaveState("saving");
    setAiError(null);
    startTransition(async () => {
      const result = await setAiProviderSetting(selectedProvider, selectedModel);
      if (result.success) {
        setAiSaveState("saved");
        setTimeout(() => setAiSaveState("idle"), 3000);
      } else {
        setAiSaveState("error");
        setAiError(result.error ?? "Unbekannter Fehler");
      }
    });
  }

  // General settings
  const [appName, setAppName] = useState("ProCon");
  const [supportEmail, setSupportEmail] = useState("support@procon.app");
  const [maxFreeUsers, setMaxFreeUsers] = useState("5");
  const [maxFreePrompts, setMaxFreePrompts] = useState("10");

  // Feature flags
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [complianceScanEnabled, setComplianceScanEnabled] = useState(true);
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [logRetentionEnabled, setLogRetentionEnabled] = useState(true);

  // Notification settings
  const [adminEmailNotifications, setAdminEmailNotifications] = useState(true);
  const [newUserNotification, setNewUserNotification] = useState(true);
  const [upgradeNotification, setUpgradeNotification] = useState(true);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: "var(--text-3)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Link>
        <span style={{ color: "var(--text-4)" }}>/</span>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-500" />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{t("appSettings.title")}</h1>
        </div>
      </div>

      {/* ── KI-Anbieter ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>KI-Anbieter</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium">
            Aktiv: {currentProvider?.label ?? selectedProvider}
          </span>
        </div>

        {/* Provider cards */}
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
                  <p className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{p.label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[p.badge] ?? ""}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  {p.description}
                </p>
                {isActive && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Zap className="h-3 w-3" /> Ausgewählt
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Model selector */}
        {currentProvider && (
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>
              Modell
            </label>
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
                    <p className="font-medium" style={{ color: "var(--text-1)" }}>{m.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{m.description}</p>
                  </div>
                  <code className="text-xs px-2 py-0.5 rounded-lg font-mono" style={{ background: "var(--panel-bg)", color: "var(--text-3)", border: "1px solid var(--panel-border)" }}>
                    {m.id}
                  </code>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error / save state */}
        {aiSaveState === "error" && aiError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {aiError}
          </div>
        )}

        <Button
          onClick={handleSaveAiProvider}
          disabled={isPending || aiSaveState === "saving"}
          className="w-full"
        >
          {aiSaveState === "saved" ? (
            <><Check className="h-4 w-4" /> Anbieter gespeichert</>
          ) : aiSaveState === "saving" || isPending ? (
            "Speichern..."
          ) : (
            <><Save className="h-4 w-4" /> KI-Anbieter speichern</>
          )}
        </Button>
      </Card>

      {/* General */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4" style={{ color: "var(--text-3)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>{t("appSettings.general")}</h2>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            id="appName"
            label={t("appSettings.appName")}
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
          <Input
            id="supportEmail"
            type="email"
            label={t("appSettings.supportEmail")}
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="maxFreeUsers"
              type="number"
              label={t("appSettings.maxFreeUsers")}
              value={maxFreeUsers}
              onChange={(e) => setMaxFreeUsers(e.target.value)}
            />
            <Input
              id="maxFreePrompts"
              type="number"
              label={t("appSettings.maxFreePrompts")}
              value={maxFreePrompts}
              onChange={(e) => setMaxFreePrompts(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Feature flags */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>{t("appSettings.features")}</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
          <Toggle enabled={registrationEnabled} onChange={setRegistrationEnabled} label={t("appSettings.registration")} description={t("appSettings.registrationDesc")} />
          <Toggle enabled={aiAnalysisEnabled} onChange={setAiAnalysisEnabled} label={t("appSettings.aiAnalysis")} description={t("appSettings.aiAnalysisDesc")} />
          <Toggle enabled={complianceScanEnabled} onChange={setComplianceScanEnabled} label={t("appSettings.complianceScan")} description={t("appSettings.complianceScanDesc")} />
          <Toggle enabled={mcpEnabled} onChange={setMcpEnabled} label={t("appSettings.mcp")} description={t("appSettings.mcpDesc")} />
          <Toggle enabled={logRetentionEnabled} onChange={setLogRetentionEnabled} label={t("appSettings.logRetention")} description={t("appSettings.logRetentionDesc")} />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4" style={{ color: "var(--text-3)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>{t("appSettings.notifications")}</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
          <Toggle enabled={adminEmailNotifications} onChange={setAdminEmailNotifications} label={t("appSettings.adminEmailNotifications")} />
          <Toggle enabled={newUserNotification} onChange={setNewUserNotification} label={t("appSettings.newUserNotification")} />
          <Toggle enabled={upgradeNotification} onChange={setUpgradeNotification} label={t("appSettings.upgradeNotification")} />
        </div>
      </Card>

      {/* Maintenance */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>{t("appSettings.maintenance")}</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>{t("appSettings.maintenanceDesc")}</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">{t("appSettings.clearLogs")}</Button>
          <Button variant="outline" size="sm">{t("appSettings.exportData")}</Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          {saved ? (
            <><Check className="h-4 w-4" /> {t("appSettings.saved")}</>
          ) : (
            <><Save className="h-4 w-4" /> {t("appSettings.save")}</>
          )}
        </Button>
      </div>
    </div>
  );
}

