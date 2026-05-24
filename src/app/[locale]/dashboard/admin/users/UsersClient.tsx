"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Users, Search, ChevronLeft, Trash2, Edit2, Check, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type UserRole = "admin" | "pm" | "developer" | "trainee";

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  organizations?: { name: string; plan: string } | null;
}

interface UsersClientProps {
  users: User[];
}

const roleOptions: UserRole[] = ["admin", "pm", "developer", "trainee"];

function getRoleBadge(role: string) {
  const map: Record<string, "danger" | "info" | "default"> = {
    admin: "danger",
    pm: "info",
    developer: "default",
    trainee: "default",
  };
  return <Badge variant={map[role] ?? "default"}>{role}</Badge>;
}

export function UsersClient({ users: initialUsers }: UsersClientProps) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("developer");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditRole(user.role);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveRole(userId: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role: editRole })
        .eq("id", userId);

      if (!error) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: editRole } : u))
        );
        setEditingId(null);
      }
    });
  }

  function deleteUser(userId: string) {
    if (!confirm(t("users.confirmDelete"))) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("profiles").delete().eq("id", userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("users.title")}</h1>
        </div>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("users.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("users.name")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("users.email")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("users.role")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("users.organization")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("users.joined")}</th>
                <th className="pb-3 text-right font-semibold text-zinc-600 dark:text-zinc-400">{t("users.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((user) => (
                <tr key={user.id} className="group">
                  <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.name || "-"}</td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="py-3">
                    {editingId === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="rounded-lg border border-indigo-400 bg-white px-2 py-1 text-xs dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {user.organizations?.name ?? "-"}
                    {user.organizations?.plan === "pro" && (
                      <Badge variant="pro" className="ml-2">Pro</Badge>
                    )}
                  </td>
                  <td className="py-3 text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(user.created_at)}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={() => saveRole(user.id)}
                            disabled={isPending}
                            className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            disabled={isPending}
                            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">{t("users.empty")}</p>
          )}
        </div>
      </Card>

      <p className="mt-3 text-xs text-zinc-400">{filtered.length} {t("users.of")} {users.length} {t("users.totalUsers")}</p>
    </div>
  );
}
