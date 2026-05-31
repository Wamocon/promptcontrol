"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type ComponentType } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  User, Lock, Bell, Shield, Trash2, Check, Copy, RefreshCw, Eye, EyeOff,
  AlertTriangle, Camera, CreditCard, Users as UsersIcon, Plug, Download,
  ChevronRight, KeyRound, Crown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import type { Profile } from "@/types";
import {
  updateProfileName,
  changePassword,
  regenerateApiKey,
  exportUserData,
  deleteAccount,
} from "./actions";

type ProfileWithOrg = Profile & {
  organizations?: { name?: string | null; plan?: string | null } | null;
};

interface ProfileClientProps {
  profile: ProfileWithOrg | null;
  userEmail: string;
}

type TabKey =
  | "profile" | "security" | "apiKeys" | "notifications"
  | "billing" | "team" | "integrations" | "gdpr" | "danger";

type Translator = ReturnType<typeof useTranslations<"profile">>;

const TAB_DEFS: Array<{ key: TabKey; icon: ComponentType<{ className?: string }>; dangerous?: boolean }> = [
  { key: "profile",       icon: User },
  { key: "security",      icon: Lock },
  { key: "apiKeys",       icon: KeyRound },
  { key: "notifications", icon: Bell },
  { key: "billing",       icon: CreditCard },
  { key: "team",          icon: UsersIcon },
  { key: "integrations",  icon: Plug },
  { key: "gdpr",          icon: Shield },
  { key: "danger",        icon: AlertTriangle, dangerous: true },
];

export function ProfileClient({ profile, userEmail }: ProfileClientProps) {
  const t = useTranslations("profile");
  const tTabs = useTranslations("profile.tabs");
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = (search.get("tab") ?? "profile") as TabKey;
  const activeTab: TabKey = TAB_DEFS.find((entry) => entry.key === tabParam)?.key ?? "profile";

  function setTab(next: TabKey) {
    const sp = new URLSearchParams(search.toString());
    sp.set("tab", next);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const name = profile?.name ?? "";
  const plan = profile?.organizations?.plan ?? "free";
  const initial = (name || userEmail).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl">
      <div className="lg:hidden">
        <ProfileHeader name={name} email={userEmail} plan={plan} role={profile?.role ?? "developer"} initial={initial} />
      </div>

      <aside className="lg:w-64 shrink-0">
        <div className="hidden lg:block mb-4">
          <ProfileHeader name={name} email={userEmail} plan={plan} role={profile?.role ?? "developer"} initial={initial} compact />
        </div>
        <nav className="panel p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto" aria-label="Profil-Bereiche">
          {TAB_DEFS.map(({ key, icon: Icon, dangerous }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? dangerous
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "text-t3 hover:text-t1 hover:bg-[color:var(--panel-bg-subtle)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{tTabs(key)}</span>
                {isActive && <ChevronRight className="hidden lg:block h-4 w-4 opacity-70" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        {activeTab === "profile" && <PersonalInfoTab profile={profile} userEmail={userEmail} t={t} />}
        {activeTab === "security" && <SecurityTab t={t} />}
        {activeTab === "apiKeys" && <ApiKeysTab initialKey={profile?.api_key ?? ""} t={t} />}
        {activeTab === "notifications" && <NotificationsTab t={t} />}
        {activeTab === "billing" && <BillingTab plan={plan} t={t} />}
        {activeTab === "team" && <TeamTab t={t} />}
        {activeTab === "integrations" && <IntegrationsTab t={t} />}
        {activeTab === "gdpr" && <GdprTab t={t} />}
        {activeTab === "danger" && <DangerTab t={t} />}
      </main>
    </div>
  );
}

function ProfileHeader({
  name, email, plan, role, initial, compact = false,
}: {
  name: string; email: string; plan: string; role: string; initial: string; compact?: boolean;
}) {
  return (
    <Card className={compact ? "flex items-center gap-3" : "flex items-center gap-5"}>
      <div className="relative shrink-0">
        <div className={`flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-900 dark:text-indigo-300 ${
          compact ? "h-12 w-12 text-lg" : "h-20 w-20 text-3xl"
        }`}>
          {initial}
        </div>
        {!compact && (
          <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white dark:border-zinc-900">
            <Camera className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="min-w-0">
        <p className={`font-semibold text-t1 truncate ${compact ? "text-sm" : "text-lg"}`}>{name || email}</p>
        <p className="text-xs text-t3 truncate">{email}</p>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {plan === "pro" ? <Badge variant="pro">Pro</Badge> : <Badge variant="default">Free</Badge>}
          <Badge variant={role === "admin" ? "danger" : "info"}>{role}</Badge>
        </div>
      </div>
    </Card>
  );
}

function Section({
  icon: Icon, title, description, children, accent = "indigo",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  accent?: "indigo" | "rose" | "amber" | "emerald" | "cyan";
}) {
  const accentMap = {
    indigo:  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    rose:    "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    amber:   "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    cyan:    "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
  };
  return (
    <Card>
      <div className="flex items-start gap-3 mb-5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-t1">{title}</h2>
          {description && <p className="text-sm text-t3">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Toggle({
  enabled, onChange, label, description,
}: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <p className="text-sm font-medium text-t1">{label}</p>
        {description && <p className="text-xs text-t3">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}

function PersonalInfoTab({ profile, userEmail, t }: { profile: ProfileWithOrg | null; userEmail: string; t: Translator }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await updateProfileName(name);
      if (!r.success) { setErr(r.error ?? "Fehler"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Section icon={User} title={t("personalInfo.title")} description={t("personalInfo.description")}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-t2 mb-2">{t("personalInfo.avatar")}</p>
          <Button type="button" variant="secondary" disabled>
            <Camera className="h-4 w-4" /> {t("personalInfo.avatarUpload")}
          </Button>
        </div>
        <Input
          id="profile-name"
          label={t("personalInfo.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("personalInfo.namePlaceholder")}
        />
        <Input id="profile-email" label={t("personalInfo.email")} value={userEmail} disabled />
        <p className="text-xs text-t4">{t("personalInfo.emailNote")}</p>
        {err && <p className="text-sm text-rose-500">{err}</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            {saved ? <><Check className="h-4 w-4" />{t("saved")}</> : t("save")}
          </Button>
        </div>
      </form>
    </Section>
  );
}

function SecurityTab({ t }: { t: Translator }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (newPw !== confirmPw) { setErr(t("password.mismatch")); return; }
    if (newPw.length < 8) { setErr(t("password.tooShort")); return; }
    startTransition(async () => {
      const r = await changePassword(newPw);
      if (!r.success) { setErr(r.error ?? "Fehler"); return; }
      setSaved(true); setNewPw(""); setConfirmPw("");
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Section icon={Lock} title={t("password.title")} description={t("password.description")}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="relative">
            <Input id="new-pw" label={t("password.newPassword")} type={showPw ? "text" : "password"}
              value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="********" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-8 text-t3 hover:text-t1">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Input id="confirm-pw" label={t("password.confirmPassword")} type={showPw ? "text" : "password"}
            value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="********" />
          {err && <p className="text-sm text-rose-500">{err}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={isPending} disabled={!newPw || !confirmPw}>
              {saved ? <><Check className="h-4 w-4" />{t("saved")}</> : t("password.change")}
            </Button>
          </div>
        </form>
      </Section>

      <Section icon={Shield} title={t("security.twoFactor")} description={t("security.twoFactorDesc")} accent="emerald">
        <div className="flex items-center justify-between panel-subtle p-4 rounded-xl">
          <div>
            <p className="text-xs text-t3">{t("security.twoFactorStatus")}</p>
            <p className="text-sm font-medium text-t1">{t("security.twoFactorDisabled")}</p>
          </div>
          <Button variant="secondary" disabled>{t("security.twoFactorEnable")}</Button>
        </div>
      </Section>

      <Section icon={KeyRound} title={t("security.sessions")} description={t("security.sessionsDesc")} accent="cyan">
        <Button variant="secondary" disabled>{t("security.signOutAll")}</Button>
      </Section>
    </div>
  );
}

function ApiKeysTab({ initialKey, t }: { initialKey: string; t: Translator }) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function regenerate() {
    if (!confirm(t("apiKey.confirmRegenerate"))) return;
    setErr(null);
    startTransition(async () => {
      const r = await regenerateApiKey();
      if (!r.success) { setErr(r.error ?? "Fehler"); return; }
      if (r.data?.apiKey) setApiKey(r.data.apiKey as string);
    });
  }

  return (
    <Section icon={KeyRound} title={t("apiKey.title")} description={t("apiKey.description")}>
      <div className="flex items-center gap-2 mb-3">
        <code className="flex-1 rounded-lg px-3 py-2 text-xs font-mono truncate panel-subtle text-t2">
          {apiKey || "********"}
        </code>
        <button onClick={copy} title={t("apiKey.copy")}
          className="rounded-lg p-2 transition-colors panel-subtle hover:bg-[color:var(--panel-bg)]">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-t3" />}
        </button>
        <button onClick={regenerate} disabled={isPending} title={t("apiKey.regenerate")}
          className="rounded-lg p-2 transition-colors panel-subtle hover:bg-[color:var(--panel-bg)] disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 text-t3 ${isPending ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">{t("apiKey.warning")}</p>
      {err && <p className="text-sm text-rose-500 mb-3">{err}</p>}
      <Button variant="secondary" disabled>{t("apiKey.createNew")}</Button>
    </Section>
  );
}

function NotificationsTab({ t }: { t: Translator }) {
  const [email, setEmail] = useState(true);
  const [pUpdates, setPUpdates] = useState(true);
  const [invites, setInvites] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  return (
    <Section icon={Bell} title={t("notifications.title")} description={t("notifications.description")}>
      <div className="divide-y divide-[color:var(--panel-border)]">
        <Toggle enabled={email} onChange={setEmail} label={t("notifications.email")} description={t("notifications.emailDesc")} />
        <Toggle enabled={pUpdates} onChange={setPUpdates} label={t("notifications.promptUpdates")} description={t("notifications.promptUpdatesDesc")} />
        <Toggle enabled={invites} onChange={setInvites} label={t("notifications.teamInvites")} />
        <Toggle enabled={newsletter} onChange={setNewsletter} label={t("notifications.newsletter")} />
      </div>
    </Section>
  );
}

function BillingTab({ plan, t }: { plan: string; t: Translator }) {
  return (
    <div className="flex flex-col gap-6">
      <Section icon={CreditCard} title={t("billing.title")} description={t("billing.description")} accent="amber">
        <div className="flex items-center justify-between panel-subtle p-4 rounded-xl mb-4">
          <div>
            <p className="text-xs text-t3">{t("billing.currentPlan")}</p>
            <div className="flex items-center gap-2 mt-1">
              {plan === "pro" ? <Crown className="h-5 w-5 text-amber-500" /> : null}
              <span className="text-lg font-semibold text-t1 capitalize">{plan}</span>
            </div>
          </div>
          {plan === "pro" ? (
            <Button variant="secondary" disabled>{t("billing.manage")}</Button>
          ) : (
            <Button>{t("billing.upgrade")}</Button>
          )}
        </div>
      </Section>

      <Section icon={CreditCard} title={t("billing.invoices")} accent="cyan">
        <p className="text-sm text-t3">{t("billing.invoicesEmpty")}</p>
      </Section>
    </div>
  );
}

function TeamTab({ t }: { t: Translator }) {
  return (
    <Section icon={UsersIcon} title={t("team.title")} description={t("team.description")}>
      <Link href="/dashboard/team">
        <Button variant="secondary">
          <UsersIcon className="h-4 w-4" /> {t("team.manage")}
        </Button>
      </Link>
    </Section>
  );
}

function IntegrationsTab({ t }: { t: Translator }) {
  const items = [
    { title: t("integrations.github"), desc: t("integrations.githubDesc") },
    { title: t("integrations.slack"),  desc: t("integrations.slackDesc") },
    { title: t("integrations.webhook"), desc: t("integrations.webhookDesc") },
  ];
  return (
    <Section icon={Plug} title={t("integrations.title")} description={t("integrations.description")}>
      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.title} className="panel-subtle p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-t1">{it.title}</p>
              <p className="text-xs text-t3">{it.desc}</p>
            </div>
            <Badge variant="default">{t("integrations.comingSoon")}</Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

function GdprTab({ t }: { t: Translator }) {
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function downloadExport() {
    setErr(null);
    startTransition(async () => {
      const r = await exportUserData();
      if (!r.success) { setErr(r.error ?? "Fehler"); return; }
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `procon-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Section icon={Shield} title={t("gdpr.title")} description={t("gdpr.description")} accent="cyan">
      <p className="text-sm text-t2 mb-4">{t("gdpr.exportDesc")}</p>
      {err && <p className="text-sm text-rose-500 mb-3">{err}</p>}
      <Button onClick={downloadExport} loading={isPending}>
        <Download className="h-4 w-4" /> {t("gdpr.download")}
      </Button>
    </Section>
  );
}

function DangerTab({ t }: { t: Translator }) {
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handle() {
    if (!confirm(t("danger.confirmDelete"))) return;
    setErr(null);
    startTransition(async () => {
      const r = await deleteAccount();
      if (!r.success) { setErr(r.error ?? t("danger.contactSupport")); return; }
      window.location.href = "/";
    });
  }

  return (
    <Card className="border-rose-300 dark:border-rose-500/40">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-t1">{t("danger.title")}</h2>
          <p className="text-sm text-t3">{t("danger.description")}</p>
        </div>
      </div>
      {err && <p className="text-sm text-rose-500 mb-3">{err}</p>}
      <Button variant="danger" onClick={handle} loading={isPending}>
        <Trash2 className="h-4 w-4" /> {t("danger.deleteAccount")}
      </Button>
    </Card>
  );
}
