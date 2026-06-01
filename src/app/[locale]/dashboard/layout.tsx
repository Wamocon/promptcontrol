import { redirect } from "next/navigation";
import { createClientSafe, createServiceClientSafe } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AiGuideChat } from "@/components/AiGuideChat";
import { CommandPalette } from "@/components/CommandPalette";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  const supabase = await createClientSafe();

  // If Supabase is not configured at all (missing ENV on Vercel) we
  // bounce the user to the login page rather than 500. The login page
  // itself surfaces the misconfiguration in a controlled way.
  if (!supabase) {
    redirect(`/${locale}/auth/login`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Profile lookup tolerates missing service-role key (degrades to anon).
  let profile:
    | {
        id?: string;
        user_id?: string;
        org_id?: string | null;
        name?: string | null;
        role?: string | null;
      }
    | null = null;
  let plan: "free" | "pro" = "free";

  try {
    const serviceSupabase = await createServiceClientSafe();
    const client = serviceSupabase ?? supabase;
    const { data } = await client
      .from("profiles")
      .select("id, user_id, org_id, name, role")
      .eq("user_id", user.id)
      .single();
    profile = data;

    if (profile?.org_id) {
      const { data: org } = await client
        .from("organizations")
        .select("plan")
        .eq("id", profile.org_id)
        .single();
      if (org?.plan === "pro") {
        plan = "pro";
      }
    }
  } catch {
    // Profile lookup failed (RLS, schema mismatch, ...). We render the
    // dashboard with a sensible default so the user is not blocked.
    profile = null;
  }

  const isAdmin = (profile?.role ?? "").toLowerCase() === "admin";

  return (
    <div className="flex h-screen flex-col overflow-hidden relative" style={{ background: "var(--background)" }}>
      <Header userName={profile?.name || user.email?.split("@")[0]} locale={locale} isAdmin={isAdmin} />
      <div className="flex flex-1 overflow-hidden relative z-[1]">
        <Sidebar plan={plan} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
          {children}
        </main>
      </div>
      <AiGuideChat />
      <CommandPalette locale={locale} />
    </div>
  );
}
