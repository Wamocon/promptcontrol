"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { UserPlus, Crown, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
  const [showInvite, setShowInvite] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      const { error } = await supabase.from("team_invitations").insert({
        org_id: currentProfile?.org_id,
        email,
        role,
      });

      if (!error) {
        setSuccessMsg(`Einladung an ${email} gesendet.`);
        setShowInvite(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-white/35">{t("subtitle")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4" />
            {t("invite")}
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Members */}
      <div
        className="rounded-2xl border border-white/7 p-6 mb-5"
        style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)" }}
      >
        <h2 className="font-semibold text-white/80 mb-4">Aktive Mitglieder ({members.length})</h2>
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/4 transition-colors">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm text-indigo-300"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                {(member.name || member.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80 truncate">{member.name || member.email}</span>
                  {member.id === currentProfile?.id && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                </div>
                <span className="text-xs text-white/30 truncate">{member.email}</span>
              </div>
              <Badge variant={roleColors[member.role]}>{t(`roles.${member.role}`)}</Badge>
              <span className="text-xs text-white/20 shrink-0">{formatDate(member.created_at)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div
          className="rounded-2xl border border-white/7 p-6"
          style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)" }}
        >
          <h2 className="font-semibold text-white/80 mb-4">Ausstehende Einladungen</h2>
          <div className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Mail className="h-4 w-4 text-white/30" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/70">{inv.email}</p>
                  <p className="text-xs text-white/30">Läuft ab: {formatDate(inv.expires_at)}</p>
                </div>
                <Badge variant={roleColors[inv.role]}>{t(`roles.${inv.role}`)}</Badge>
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
