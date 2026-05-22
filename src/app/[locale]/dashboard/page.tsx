import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
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
    { label: t("totalPrompts"), value: totalPrompts, icon: FileText, color: "text-indigo-600" },
    { label: t("totalProjects"), value: totalProjects, icon: FolderOpen, color: "text-purple-600" },
    { label: t("apiCalls"), value: todayLogs, icon: Activity, color: "text-green-600" },
    { label: t("teamMembers"), value: 1, icon: Users, color: "text-orange-600" },
  ];

  const name = profile?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("welcome")}, {name}!
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("overview")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
              </div>
              <div className={`rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("recentActivity")}</h2>
          </div>
          {recentPrompts && recentPrompts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentPrompts.map((prompt) => (
                <div key={prompt.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{prompt.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(prompt.projects as { name?: string } | null)?.name} - {formatDate(prompt.updated_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prompt.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"}`}>
                    {prompt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Aktivitäten.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{t("quickActions")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("newPrompt"), href: "/dashboard/projects", icon: FileText },
              { label: t("newProject"), href: "/dashboard/projects", icon: FolderOpen },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 p-4 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-colors dark:border-zinc-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
              >
                <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
