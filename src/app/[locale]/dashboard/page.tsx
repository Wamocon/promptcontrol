import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import {
  FileText,
  FolderOpen,
  Activity,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const [profileResult, promptsResult, projectsResult, logsResult] = await Promise.all([
    supabase.from("profiles").select("*, organizations(*)").eq("user_id", user!.id).single(),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("prompt_logs").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
  ]);

  const profile = profileResult.data;
  const totalPrompts = promptsResult.count ?? 0;
  const totalProjects = projectsResult.count ?? 0;
  const todayLogs = logsResult.count ?? 0;

  // Recent prompts
  const { data: recentPrompts } = await supabase
    .from("prompts")
    .select("id, name, status, updated_at, projects(name)")
    .order("updated_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: t("totalPrompts"), value: totalPrompts, icon: FileText, color: "text-indigo-400", bg: "rgba(99,102,241,0.12)", glow: "rgba(99,102,241,0.22)" },
    { label: t("totalProjects"), value: totalProjects, icon: FolderOpen, color: "text-purple-400", bg: "rgba(168,85,247,0.12)", glow: "rgba(168,85,247,0.22)" },
    { label: t("apiCalls"), value: todayLogs, icon: Activity, color: "text-emerald-400", bg: "rgba(16,185,129,0.12)", glow: "rgba(16,185,129,0.22)" },
    { label: t("teamMembers"), value: 1, icon: Users, color: "text-amber-400", bg: "rgba(245,158,11,0.12)", glow: "rgba(245,158,11,0.22)" },
  ];

  const name = profile?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-t1">
          {t("welcome")}, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{name}</span>!
        </h1>
        <p className="mt-1.5 text-sm text-t3">{t("overview")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, glow }) => (
          <div
            key={label}
            className="card-hover glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-t4 uppercase tracking-wider">{label}</p>
              <div
                className={`rounded-xl p-2 ${color}`}
                style={{ background: bg, boxShadow: `0 0 20px ${glow}` }}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="metric-number text-t1">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div
          className="glass-card p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="font-semibold text-t1">{t("recentActivity")}</h2>
          </div>
          {recentPrompts && recentPrompts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "var(--panel-bg-subtle)" }}
                >
                  <div>
                    <p className="text-sm font-medium text-t1">{prompt.name}</p>
                    <p className="text-xs text-t4 mt-0.5">
                      {(prompt.projects as { name?: string } | null)?.name} &middot; {formatDate(prompt.updated_at)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      prompt.status === "active"
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-400/12 border border-emerald-400/20"
                        : "text-t4 border"
                    }`}
                  >
                    {prompt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-t3">Noch keine Aktivitäten.</p>
          )}
        </div>

        <div
          className="glass-card p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <h2 className="font-semibold text-t1">{t("quickActions")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("newPrompt"), href: "/dashboard/projects", icon: FileText, color: "text-indigo-500", bg: "rgba(99,102,241,0.10)" },
              { label: t("newProject"), href: "/dashboard/projects", icon: FolderOpen, color: "text-purple-500", bg: "rgba(168,85,247,0.10)" },
            ].map(({ label, href, icon: Icon, color, bg }) => (
              <a
                key={label}
                href={href}
              className="card-hover flex flex-col items-center gap-3 rounded-xl p-5 text-center"
              style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)" }}
              >
                <Icon className={`h-7 w-7 ${color}`} />
                <span className="text-sm font-medium text-t2">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
