import { redirect } from "next/navigation";
import { createClientSafe, createServiceClientSafe } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AiGuideChat } from "@/components/AiGuideChat";
import { CommandPalette } from "@/components/CommandPalette";
import { CursorSpotlight } from "@/components/effects/CursorSpotlight";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { AchievementToast } from "@/components/gamification/AchievementToast";

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
        name?: string | null;
        role?: string | null;
        organizations?: { plan?: string } | null;
      }
    | null = null;

  try {
    const serviceSupabase = await createServiceClientSafe();
    const client = serviceSupabase ?? supabase;
    const { data } = await client
      .from("profiles")
      .select("*, organizations(*)")
      .eq("user_id", user.id)
      .single();
    profile = data;
  } catch {
    // Profile lookup failed (RLS, schema mismatch, ...). We render the
    // dashboard with a sensible default so the user is not blocked.
    profile = null;
  }

  const plan = (profile?.organizations as { plan?: string } | null)?.plan ?? "free";
  const isAdmin = profile?.role === "admin";

  return (
    <GamificationProvider>
      <div className="flex h-screen flex-col overflow-hidden relative" style={{ background: "var(--background)" }}>
        <CursorSpotlight />
        <Header userName={profile?.name || user.email?.split("@")[0]} locale={locale} />
        <div className="flex flex-1 overflow-hidden relative z-[1]">
          <Sidebar plan={plan as "free" | "pro"} isAdmin={isAdmin} />
          <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
            {children}
          </main>
        </div>
        <AiGuideChat />
        <CommandPalette locale={locale} />
        <AchievementToast />
      </div>
    </GamificationProvider>
  );
}
