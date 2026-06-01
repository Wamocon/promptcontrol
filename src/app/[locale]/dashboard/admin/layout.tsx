import { redirect } from "next/navigation";
import { createClientSafe, createServiceClientSafe } from "@/lib/supabase/server";
import { AdminTabs } from "./AdminTabs";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClientSafe();
  if (!supabase) {
    redirect(`/${locale}/auth/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const service = await createServiceClientSafe();
  const roleClient = service ?? supabase;

  const { data: profile } = await roleClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex h-full flex-col">
      <AdminTabs />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
