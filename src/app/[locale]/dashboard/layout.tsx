import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Use service client to bypass RLS for the profile lookup
  // (we have already verified authentication above)
  const serviceSupabase = await createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .single();

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
