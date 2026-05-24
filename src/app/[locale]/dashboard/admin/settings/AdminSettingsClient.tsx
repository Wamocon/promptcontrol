"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Settings, ChevronLeft, Bell, Shield, Globe, Database, Save, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
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

export function AdminSettingsClient() {
  const t = useTranslations("admin");
  const [saved, setSaved] = useState(false);

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
    // In a real app, this would call a server action
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("appSettings.title")}</h1>
        </div>
      </div>

      {/* General */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("appSettings.general")}</h2>
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
          <Shield className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("appSettings.features")}</h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Toggle
            enabled={registrationEnabled}
            onChange={setRegistrationEnabled}
            label={t("appSettings.registration")}
            description={t("appSettings.registrationDesc")}
          />
          <Toggle
            enabled={aiAnalysisEnabled}
            onChange={setAiAnalysisEnabled}
            label={t("appSettings.aiAnalysis")}
            description={t("appSettings.aiAnalysisDesc")}
          />
          <Toggle
            enabled={complianceScanEnabled}
            onChange={setComplianceScanEnabled}
            label={t("appSettings.complianceScan")}
            description={t("appSettings.complianceScanDesc")}
          />
          <Toggle
            enabled={mcpEnabled}
            onChange={setMcpEnabled}
            label={t("appSettings.mcp")}
            description={t("appSettings.mcpDesc")}
          />
          <Toggle
            enabled={logRetentionEnabled}
            onChange={setLogRetentionEnabled}
            label={t("appSettings.logRetention")}
            description={t("appSettings.logRetentionDesc")}
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("appSettings.notifications")}</h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Toggle
            enabled={adminEmailNotifications}
            onChange={setAdminEmailNotifications}
            label={t("appSettings.adminEmailNotifications")}
          />
          <Toggle
            enabled={newUserNotification}
            onChange={setNewUserNotification}
            label={t("appSettings.newUserNotification")}
          />
          <Toggle
            enabled={upgradeNotification}
            onChange={setUpgradeNotification}
            label={t("appSettings.upgradeNotification")}
          />
        </div>
      </Card>

      {/* Maintenance */}
      <Card className="mb-6 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("appSettings.maintenance")}</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{t("appSettings.maintenanceDesc")}</p>
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
