"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  Check,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface ProfileClientProps {
  profile: (Profile & { organizations?: { name?: string; plan?: string } | null }) | null;
  userEmail: string;
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
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

export function ProfileClient({ profile, userEmail }: ProfileClientProps) {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();

  // Profile info state
  const [profileSaved, setProfileSaved] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");

  // Password state
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");

  // API key state
  const [apiKey, setApiKey] = useState(profile?.api_key ?? "");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Notification state
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPromptUpdates, setNotifPromptUpdates] = useState(true);
  const [notifTeamInvites, setNotifTeamInvites] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);

  // Security state (reserved for future use)

  const plan = profile?.organizations?.plan ?? "free";

  // --- Handlers ---

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("profiles").update({ name }).eq("id", profile!.id);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    });
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) {
      setPwError(t("password.mismatch"));
      return;
    }
    if (newPw.length < 8) {
      setPwError(t("password.tooShort"));
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        setPwError(error.message);
      } else {
        setPasswordSaved(true);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => setPasswordSaved(false), 2000);
      }
    });
  }

  async function copyApiKey() {
    await navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  }

  async function regenerateApiKey() {
    if (!confirm(t("apiKey.confirmRegenerate"))) return;
    const supabase = createClient();
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await supabase.from("profiles").update({ api_key: newKey }).eq("id", profile!.id);
    setApiKey(newKey);
  }

  function handleDeleteAccount() {
    if (!confirm(t("danger.confirmDelete"))) return;
    // In a real app, this would call a server action to delete the account
    alert(t("danger.contactSupport"));
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Avatar & plan info */}
      <Card className="mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-3xl font-bold dark:bg-indigo-900 dark:text-indigo-300">
            {(name || userEmail).charAt(0).toUpperCase()}
          </div>
          <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white dark:border-zinc-900">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{name || userEmail}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{userEmail}</p>
          <div className="mt-2 flex items-center gap-2">
            {plan === "pro" ? (
              <Badge variant="pro">Pro Plan</Badge>
            ) : (
              <Badge variant="default">Free Plan</Badge>
            )}
            <Badge variant={profile?.role === "admin" ? "danger" : "info"}>
              {profile?.role ?? "developer"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Personal info */}
      <Section icon={User} title={t("personalInfo.title")} description={t("personalInfo.description")}>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <Input
            id="profile-name"
            label={t("personalInfo.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("personalInfo.namePlaceholder")}
          />
          <Input
            id="profile-email"
            label={t("personalInfo.email")}
            value={userEmail}
            disabled
          />
          <p className="text-xs text-zinc-400">{t("personalInfo.emailNote")}</p>
          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              {profileSaved ? <><Check className="h-4 w-4" />{t("saved")}</> : t("save")}
            </Button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title={t("password.title")} description={t("password.description")}>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <div className="relative">
            <Input
              id="new-password"
              label={t("password.newPassword")}
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Input
            id="confirm-password"
            label={t("password.confirmPassword")}
            type={showPw ? "text" : "password"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="••••••••"
          />
          {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={isPending} disabled={!newPw || !confirmPw}>
              {passwordSaved ? <><Check className="h-4 w-4" />{t("saved")}</> : t("password.change")}
            </Button>
          </div>
        </form>
      </Section>

      {/* API Key */}
      <Section icon={Shield} title={t("apiKey.title")} description={t("apiKey.description")}>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 truncate">
            {apiKey}
          </code>
          <button
            onClick={copyApiKey}
            title={t("apiKey.copy")}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {apiKeyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-zinc-500" />}
          </button>
          <button
            onClick={regenerateApiKey}
            title={t("apiKey.regenerate")}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("apiKey.warning")}
        </p>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title={t("notifications.title")} description={t("notifications.description")}>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Toggle
            enabled={notifEmail}
            onChange={setNotifEmail}
            label={t("notifications.email")}
            description={t("notifications.emailDesc")}
          />
          <Toggle
            enabled={notifPromptUpdates}
            onChange={setNotifPromptUpdates}
            label={t("notifications.promptUpdates")}
            description={t("notifications.promptUpdatesDesc")}
          />
          <Toggle
            enabled={notifTeamInvites}
            onChange={setNotifTeamInvites}
            label={t("notifications.teamInvites")}
          />
          <Toggle
            enabled={notifNewsletter}
            onChange={setNotifNewsletter}
            label={t("notifications.newsletter")}
          />
        </div>
      </Section>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("danger.title")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("danger.description")}</p>
          </div>
        </div>
        <Button variant="danger" onClick={handleDeleteAccount}>
          <Trash2 className="h-4 w-4" />
          {t("danger.deleteAccount")}
        </Button>
      </Card>
    </div>
  );
}
