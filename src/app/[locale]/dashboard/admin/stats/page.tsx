import { createClientSafe } from "@/lib/supabase/server";
import { StatsClient, type AdminStats } from "./StatsClient";

export default async function AdminStatsPage() {
  const stats = await loadStats();
  return <StatsClient stats={stats} />;
}

async function loadStats(): Promise<AdminStats> {
  const supabase = await createClientSafe();
  if (!supabase) return emptyStats();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      { count: totalUsers },
      { count: totalOrgs },
      { count: totalPrompts },
      { count: totalLogs },
      { count: proOrgs },
      { count: freeOrgs },
      { count: growth7d },
      { count: growth30d },
      { data: profilesRoles },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("prompts").select("*", { count: "exact", head: true }),
      supabase.from("prompt_logs").select("*", { count: "exact", head: true }),
      supabase.from("organizations").select("*", { count: "exact", head: true }).eq("plan", "pro"),
      supabase.from("organizations").select("*", { count: "exact", head: true }).eq("plan", "free"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabase.from("profiles").select("role"),
    ]);

    const roleBreakdown: Record<string, number> = {};
    for (const row of profilesRoles ?? []) {
      const r = (row as { role: string }).role ?? "unknown";
      roleBreakdown[r] = (roleBreakdown[r] ?? 0) + 1;
    }

    return {
      totalUsers: totalUsers ?? 0,
      totalOrgs: totalOrgs ?? 0,
      totalPrompts: totalPrompts ?? 0,
      totalLogs: totalLogs ?? 0,
      proOrgs: proOrgs ?? 0,
      freeOrgs: freeOrgs ?? 0,
      growth7d: growth7d ?? 0,
      growth30d: growth30d ?? 0,
      roleBreakdown,
    };
  } catch {
    return emptyStats();
  }
}

function emptyStats(): AdminStats {
  return {
    totalUsers: 0,
    totalOrgs: 0,
    totalPrompts: 0,
    totalLogs: 0,
    proOrgs: 0,
    freeOrgs: 0,
    growth7d: 0,
    growth30d: 0,
    roleBreakdown: {},
  };
}
