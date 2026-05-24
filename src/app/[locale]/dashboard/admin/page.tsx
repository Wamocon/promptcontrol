import { createClient } from "@/lib/supabase/server";
import { AdminOverviewClient } from "./AdminOverviewClient";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { count: orgCount }, { count: promptCount }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("prompts").select("*", { count: "exact", head: true }),
    ]);

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, plan, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AdminOverviewClient
      stats={{ userCount: userCount ?? 0, orgCount: orgCount ?? 0, promptCount: promptCount ?? 0 }}
      recentUsers={recentUsers ?? []}
      recentOrgs={orgs ?? []}
    />
  );
}
