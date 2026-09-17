"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, Crown, Mail, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { formatDate } from "@/lib/utils";
import type { Profile, TeamInvitation, UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface TeamClientProps {
  currentProfile: Profile | null;
  members: Profile[];
  invitations: TeamInvitation[];
}

export function TeamClient({ currentProfile, members, invitations }: TeamClientProps) {
  const t = useTranslations("team");
  const params = useParams();
  const locale = (params.locale as string) || "de";
  const [showInvite, setShowInvite] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  function acceptUrl(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${locale}/auth/accept-invite/${token}`;
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(acceptUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const isAdmin = currentProfile?.role === "admin";

  const roleColors: Record<UserRole, "success" | "info" | "warning" | "default"> = {
    admin: "success",
    pm: "info",
    developer: "warning",
    trainee: "default",
  };

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    startTransition(async () => {
      const supabase = createClient();
      const { data: created, error } = await supabase
        .from("team_invitations")
        .insert({ org_id: currentProfile?.org_id, email, role })
        .select()
        .single();

      if (!error && created) {
        setSuccessMsg(`Einladung für ${email} angelegt. Es wird keine E-Mail verschickt, den Link unten kopieren und weitergeben.`);
        setInviteLink(acceptUrl(created.token));
        setShowInvite(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-t3">{t("subtitle")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4" />
            {t("invite")}
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-500">
          <p>{successMsg}</p>
          {inviteLink && (
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/10 dark:bg-white/10 px-2 py-1 text-xs">
                {inviteLink}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Kopieren
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="panel p-6 mb-5">
        <h2 className="font-semibold text-t1 mb-4">Aktive Mitglieder ({members.length})</h2>
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/3 dark:hover:bg-white/4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm text-indigo-500 dark:text-indigo-300"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                {(member.name || member.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-t1 truncate">{member.name || member.email}</span>
                  {member.id === currentProfile?.id && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                </div>
                <span className="text-xs text-t3 truncate">{member.email}</span>
              </div>
              <Badge variant={roleColors[member.role]}>{t(`roles.${member.role}`)}</Badge>
              <span className="text-xs text-t4 shrink-0">{formatDate(member.created_at)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="panel p-6">
          <h2 className="font-semibold text-t1 mb-4">Ausstehende Einladungen</h2>
          <div className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 panel-subtle">
                <Mail className="h-4 w-4 text-t3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-t2">{inv.email}</p>
                  <p className="text-xs text-t3">Läuft ab: {formatDate(inv.expires_at)}</p>
                </div>
                <Badge variant={roleColors[inv.role]}>{t(`roles.${inv.role}`)}</Badge>
                <button
                  onClick={() => copyLink(inv.token)}
                  className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t3 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
                >
                  {copiedToken === inv.token ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {copiedToken === inv.token ? "Kopiert" : "Link"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={showInvite} onClose={() => setShowInvite(false)} title={t("invite")}>
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <Input id="email" name="email" type="email" label={t("email")} placeholder="name@firma.de" required />
          <Select id="role" name="role" label={t("role")}>
            <option value="developer">Entwickler</option>
            <option value="pm">Produktmanager</option>
            <option value="trainee">Trainee</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Abbrechen</Button>
            <Button type="submit" loading={isPending}>{t("invite")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
