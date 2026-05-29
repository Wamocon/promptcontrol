import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AiGuideChat } from "@/components/AiGuideChat";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .single();

  const plan = (profile?.organizations as { plan?: string } | null)?.plan ?? "free";
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      <Header userName={profile?.name || user.email?.split("@")[0]} locale={locale} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar plan={plan as "free" | "pro"} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
          {children}
        </main>
      </div>
      <AiGuideChat />
    </div>
  );
}
