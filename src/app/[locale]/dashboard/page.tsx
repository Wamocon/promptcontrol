import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  FileText,
  FolderOpen,
  Activity,
  Users,
  Clock,
  Wrench,
  Layers,
  Plus,
  FileUp,
  UserPlus,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SkillCategory } from "@/types";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  const [
    profileResult,
    skillsResult,
    categoriesResult,
    promptsResult,
    projectsResult,
    logsResult,
    membersResult,
    recentSkillsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*, organizations(*)").eq("user_id", user!.id).single(),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase.from("skill_categories").select("*"),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("prompt_logs").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("skills")
      .select("id, name, slug, status, updated_at, category:skill_categories(name, color)")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const profile = profileResult.data;
  const categories = (categoriesResult.data ?? []) as SkillCategory[];

  type EmbeddedCategory = { name: string; color: string };
  type RecentSkillRow = {
    id: string;
    name: string;
    slug: string;
    status: string;
    updated_at: string;
    // PostgREST liefert den Embed je nach Typgenerierung als Objekt oder Array
    category: EmbeddedCategory | EmbeddedCategory[] | null;
  };

  const recentSkills = ((recentSkillsResult.data ?? []) as unknown as RecentSkillRow[]).map((row) => ({
    ...row,
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category,
  }));

  // Anzahl Skills je Kategorie, in einer Abfrage statt einer pro Kategorie
  const { data: skillCategoryRows } = await supabase.from("skills").select("category_id");
  const countByCategory = new Map<string, number>();
  for (const row of skillCategoryRows ?? []) {
    const key = (row as { category_id: string | null }).category_id ?? "__none__";
    countByCategory.set(key, (countByCategory.get(key) ?? 0) + 1);
  }

  const stats = [
    {
      label: t("totalSkills"),
      value: skillsResult.count ?? 0,
      icon: Wrench,
      color: "text-indigo-400",
      bg: "rgba(99,102,241,0.12)",
      glow: "rgba(99,102,241,0.22)",
      href: "/dashboard/skills" as const,
    },
    {
      label: t("totalCategories"),
      value: categories.length,
      icon: Layers,
      color: "text-violet-400",
      bg: "rgba(139,92,246,0.12)",
      glow: "rgba(139,92,246,0.22)",
      href: "/dashboard/skills" as const,
    },
    {
      label: t("totalPrompts"),
      value: promptsResult.count ?? 0,
      icon: FileText,
      color: "text-purple-400",
      bg: "rgba(168,85,247,0.12)",
      glow: "rgba(168,85,247,0.22)",
      href: "/dashboard/projects" as const,
    },
    {
      label: t("totalProjects"),
      value: projectsResult.count ?? 0,
      icon: FolderOpen,
      color: "text-sky-400",
      bg: "rgba(56,189,248,0.12)",
      glow: "rgba(56,189,248,0.22)",
      href: "/dashboard/projects" as const,
    },
    {
      label: t("teamMembers"),
      value: membersResult.count ?? 1,
      icon: Users,
      color: "text-amber-400",
      bg: "rgba(245,158,11,0.12)",
      glow: "rgba(245,158,11,0.22)",
      href: "/dashboard/team" as const,
    },
    {
      label: t("apiCalls"),
      value: logsResult.count ?? 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "rgba(16,185,129,0.12)",
      glow: "rgba(16,185,129,0.22)",
      href: "/dashboard/logs" as const,
    },
  ];

  const quickActions = [
    { label: t("newSkill"), href: "/dashboard/skills" as const, icon: Plus, color: "text-indigo-500" },
    { label: t("importSkill"), href: "/dashboard/skills" as const, icon: FileUp, color: "text-violet-500" },
    { label: t("inviteMember"), href: "/dashboard/team" as const, icon: UserPlus, color: "text-amber-500" },
    { label: t("mcpSetup"), href: "/dashboard/mcp-guide" as const, icon: BookOpen, color: "text-emerald-500" },
  ];

  const name = profile?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-4 sm:p-6 animate-fade-in-up">
      {/* Begruessung */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-t1">
          {t("welcome")},{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{name}</span>!
        </h1>
        <p className="mt-1.5 text-sm text-t3">{t("overview")}</p>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 mb-6 sm:mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, glow, href }) => (
          <Link key={label} href={href} className="card-hover glass-card p-4 sm:p-5 block">
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
              <p className="min-w-0 text-[10px] sm:text-xs font-medium text-t4 uppercase tracking-wider truncate">{label}</p>
              <div className={`rounded-xl p-2 shrink-0 ${color}`} style={{ background: bg, boxShadow: `0 0 20px ${glow}` }}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="metric-number text-t1">{value}</p>
          </Link>
        ))}
      </div>

      {/* grid-cols-1 als Basis ist Pflicht: ohne explizite Spaltenzahl
          verwendet CSS Grid implizit "auto"-Spuren statt minmax(0,1fr),
          die sich am Inhalt statt am Container orientieren, dadurch
          entsteht der horizontale Overflow. */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Zuletzt geaenderte Skills */}
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
              <h2 className="font-semibold text-t1 truncate">{t("recentSkills")}</h2>
            </div>
            <Link
              href="/dashboard/skills"
              className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 shrink-0"
            >
              {t("showAll")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentSkills.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href="/dashboard/skills"
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "var(--panel-bg-subtle)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-t1 truncate">{skill.name}</p>
                    <p className="text-xs text-t4 mt-0.5 truncate">{formatDate(skill.updated_at)}</p>
                  </div>
                  {skill.category && (
                    // max-w + truncate, sonst zwingt shrink-0 bei langen
                    // Kategorienamen (z.B. "Copilot-Instructions") die ganze
                    // Zeile in die Breite statt selbst nachzugeben
                    <span
                      className="max-w-[40%] shrink-0 truncate text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${skill.category.color}20`, color: skill.category.color }}
                      title={skill.category.name}
                    >
                      {skill.category.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-t3">{t("noSkills")}</p>
          )}
        </div>

        {/* Skills nach Kategorie */}
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400 shrink-0" />
            <h2 className="font-semibold text-t1">{t("skillsByCategory")}</h2>
          </div>
          {categories.length > 0 ? (
            <div className="flex flex-col gap-3">
              {categories.map((cat) => {
                const count = countByCategory.get(cat.id) ?? 0;
                const total = skillsResult.count ?? 1;
                const pct = Math.round((count / Math.max(total, 1)) * 100);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5 gap-2">
                      <span className="flex items-center gap-2 text-t2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="text-t4 text-xs shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-t3">{t("noSkills")}</p>
          )}
        </div>
      </div>

      {/* Schnellaktionen */}
      <div className="glass-card p-5 sm:p-6 mt-4 sm:mt-5">
        <h2 className="font-semibold text-t1 mb-4 sm:mb-5">{t("quickActions")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ label, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="card-hover flex min-w-0 flex-col items-center gap-2.5 rounded-xl p-4 sm:p-5 text-center"
              style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)" }}
            >
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 ${color}`} />
              <span className="text-xs sm:text-sm font-medium text-t2 truncate max-w-full">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
