import Link from "next/link";
import { createServiceClientSafe } from "@/lib/supabase/server";
import RegisterPage from "../../register/page";

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;
  const service = await createServiceClientSafe();

  const { data: invite } = service
    ? await service
        .from("team_invitations")
        .select("email, org_id, organizations(name)")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single()
    : { data: null };

  if (!invite) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center px-4 py-10"
        style={{ background: "var(--background)" }}
      >
        <div className="panel relative z-10 w-full max-w-sm p-7 text-center shadow-2xl">
          <h1 className="mb-2 text-xl font-bold text-t1">Einladung ungültig</h1>
          <p className="mb-6 text-sm text-t3">
            Dieser Einladungslink ist ungültig, abgelaufen oder wurde bereits verwendet.
          </p>
          <Link
            href="/auth/register"
            className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            Zur normalen Registrierung
          </Link>
        </div>
      </div>
    );
  }

  const orgName =
    (invite as unknown as { organizations?: { name?: string } }).organizations?.name ?? "";

  return <RegisterPage inviteToken={token} lockedEmail={invite.email} orgName={orgName} />;
}
