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
    .select("*")
    .eq("user_id", user.id)
    .single();

  let profileWithOrg = profile as (typeof profile & { organizations?: { name?: string; plan?: string } | null }) | null;
  if (profile?.org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, plan")
      .eq("id", profile.org_id)
      .single();
    profileWithOrg = {
      ...profile,
      organizations: org ?? null,
    };
  }

  return <ProfileClient profile={profileWithOrg} userEmail={user.email ?? ""} />;
}
