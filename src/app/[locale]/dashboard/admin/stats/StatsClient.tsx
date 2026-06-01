"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Users, Building2, FileText, Activity, Crown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface AdminStats {
  totalUsers: number;
  totalOrgs: number;
  totalPrompts: number;
  totalLogs: number;
  proOrgs: number;
  freeOrgs: number;
  growth7d: number;
  growth30d: number;
  roleBreakdown: Record<string, number>;
}

interface Props {
  stats: AdminStats;
}

export function StatsClient({ stats }: Props) {
  const t = useTranslations("admin.stats");
  const totalRoles = Object.values(stats.roleBreakdown).reduce((a, b) => a + b, 0) || 1;
  const totalPlans = stats.proOrgs + stats.freeOrgs || 1;

  const cards = [
    { label: t("totalUsers"),   value: stats.totalUsers,   icon: Users,    color: "text-indigo-500" },
    { label: t("totalOrgs"),    value: stats.totalOrgs,    icon: Building2, color: "text-purple-500" },
    { label: t("totalPrompts"), value: stats.totalPrompts, icon: FileText, color: "text-cyan-500" },
    { label: t("totalLogs"),    value: stats.totalLogs,    icon: Activity, color: "text-emerald-500" },
    { label: t("proOrgs"),      value: stats.proOrgs,      icon: Crown,    color: "text-amber-500" },
    { label: t("freeOrgs"),     value: stats.freeOrgs,     icon: Building2, color: "text-t3" },
    { label: t("growth7d"),     value: stats.growth7d,     icon: TrendingUp, color: "text-emerald-500" },
    { label: t("growth30d"),    value: stats.growth30d,    icon: TrendingUp, color: "text-indigo-500" },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-cyan-500" />
        <h1 className="text-xl font-bold text-t1">{t("title")}</h1>
      </div>
      <p className="text-sm text-t3 mb-6">{t("description")}</p>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-t3 uppercase tracking-wider">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-t1">{value.toLocaleString("de-DE")}</p>
          </Card>
        ))}
      </div>

      {/* Role breakdown */}
      <Card className="mb-6">
        <h2 className="font-semibold text-t1 mb-4">{t("roleBreakdown")}</h2>
        <div className="flex flex-col gap-3">
          {Object.entries(stats.roleBreakdown).map(([role, count]) => {
            const pct = Math.round((count / totalRoles) * 100);
            return (
              <div key={role}>
                <div className="flex justify-between text-xs text-t2 mb-1.5">
                  <span className="font-medium capitalize">{role}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden panel-subtle">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(stats.roleBreakdown).length === 0 && (
            <p className="text-sm text-t3">Keine Daten verfügbar.</p>
          )}
        </div>
      </Card>

      {/* Plan breakdown */}
      <Card>
        <h2 className="font-semibold text-t1 mb-4">{t("planBreakdown")}</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Pro", count: stats.proOrgs, color: "from-amber-500 to-amber-400" },
            { label: "Free", count: stats.freeOrgs, color: "from-zinc-400 to-zinc-500" },
          ].map(({ label, count, color }) => {
            const pct = Math.round((count / totalPlans) * 100);
            return (
              <div key={label}>
                <div className="flex justify-between text-xs text-t2 mb-1.5">
                  <span className="font-medium">{label}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden panel-subtle">
                  <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
