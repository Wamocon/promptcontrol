import { redirect } from "next/navigation";
import { createClientSafe } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClientSafe();
  if (!supabase) redirect(`/${locale}/auth/login`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name, plan)")
    .eq("user_id", user.id)
    .single();

  return <ProfileClient profile={profile} userEmail={user.email ?? ""} />;
}
