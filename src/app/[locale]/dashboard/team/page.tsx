import { createClient } from "@/lib/supabase/server";
import { TeamClient } from "./TeamClient";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("user_id", user!.id)
    .single();

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", profile?.org_id)
    .order("created_at");

  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("org_id", profile?.org_id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  return (
    <TeamClient
      currentProfile={profile}
      members={members ?? []}
      invitations={invitations ?? []}
    />
  );
}
