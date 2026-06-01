"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Users, Building2, FileText, Settings, CreditCard, ShieldCheck, Bot } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Stats {
  userCount: number;
  orgCount: number;
  promptCount: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface RecentOrg {
  id: string;
  name: string;
  plan: string;
  subscription_status: string | null;
  created_at: string;
}

interface AdminOverviewClientProps {
  stats: Stats;
  recentUsers: RecentUser[];
  recentOrgs: RecentOrg[];
}

const adminSections = [
  {
    href: "/dashboard/admin/users" as const,
    icon: Users,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    href: "/dashboard/admin/subscriptions" as const,
    icon: CreditCard,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    href: "/dashboard/admin/settings" as const,
    icon: Settings,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    href: "/dashboard/admin/ai-providers" as const,
    icon: Bot,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
];

function getRoleBadge(role: string) {
  if (role === "admin") return <Badge variant="danger">Admin</Badge>;
  if (role === "pm") return <Badge variant="info">PM</Badge>;
  if (role === "developer") return <Badge variant="default">Developer</Badge>;
  return <Badge variant="default">{role}</Badge>;
}

function getPlanBadge(plan: string) {
  if (plan === "pro") return <Badge variant="pro">Pro</Badge>;
  return <Badge variant="default">Free</Badge>;
}

export function AdminOverviewClient({ stats, recentUsers, recentOrgs }: AdminOverviewClientProps) {
  const t = useTranslations("admin");

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.userCount}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("overviewStats.users")}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
            <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.orgCount}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("overviewStats.organizations")}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.promptCount}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("overviewStats.prompts")}</p>
          </div>
        </Card>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {adminSections.map(({ href, icon: Icon, color, bg }) => {
          const key = href.split("/").pop() as "users" | "subscriptions" | "settings" | "ai-providers";
          const normalizedKey = key === "ai-providers" ? "aiProviders" : key;
          return (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t(`sections.${normalizedKey}.title`)}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t(`sections.${normalizedKey}.description`)}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent users + orgs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("recentUsers")}</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
              {t("viewAll")}
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{u.name || u.email}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(u.created_at)}</p>
                </div>
                {getRoleBadge(u.role)}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("recentOrgs")}</h2>
            <Link href="/dashboard/admin/subscriptions" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
              {t("viewAll")}
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentOrgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{org.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(org.created_at)}</p>
                </div>
                {getPlanBadge(org.plan)}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
