"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { CreditCard, ChevronLeft, Search, Check, X, Edit2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type PlanType = "free" | "pro";
type SubStatus = "active" | "cancelled" | "past_due" | "trialing" | null;

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  subscription_status: SubStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
}

interface SubscriptionsClientProps {
  organizations: Organization[];
}

function getStatusBadge(status: SubStatus, plan: string) {
  if (plan === "pro" && status === "active") return <Badge variant="success">Aktiv</Badge>;
  if (status === "trialing") return <Badge variant="info">Trial</Badge>;
  if (status === "past_due") return <Badge variant="warning">Ausstehend</Badge>;
  if (status === "cancelled") return <Badge variant="danger">Gekündigt</Badge>;
  return <Badge variant="default">Free</Badge>;
}

export function SubscriptionsClient({ organizations: initialOrgs }: SubscriptionsClientProps) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState(initialOrgs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<PlanType>("free");
  const [editStatus, setEditStatus] = useState<SubStatus>("active");
  const [isPending, startTransition] = useTransition();

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(org: Organization) {
    setEditingId(org.id);
    setEditPlan(org.plan);
    setEditStatus(org.subscription_status);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveSubscription(orgId: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizations")
        .update({ plan: editPlan, subscription_status: editStatus })
        .eq("id", orgId);

      if (!error) {
        setOrgs((prev) =>
          prev.map((o) =>
            o.id === orgId ? { ...o, plan: editPlan, subscription_status: editStatus } : o
          )
        );
        setEditingId(null);
      }
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
          <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("subscriptions.title")}</h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("subscriptions.totalOrgs"), value: orgs.length, color: "text-zinc-900 dark:text-zinc-100" },
          { label: "Pro", value: orgs.filter((o) => o.plan === "pro").length, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Free", value: orgs.filter((o) => o.plan === "free").length, color: "text-zinc-600 dark:text-zinc-400" },
          { label: "Trial", value: orgs.filter((o) => o.subscription_status === "trialing").length, color: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("subscriptions.search")}
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
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.org")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.plan")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.status")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.stripeId")}</th>
                <th className="pb-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.created")}</th>
                <th className="pb-3 text-right font-semibold text-zinc-600 dark:text-zinc-400">{t("subscriptions.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((org) => (
                <tr key={org.id}>
                  <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {org.name}
                    <span className="ml-1 text-xs text-zinc-400">/{org.slug}</span>
                  </td>
                  <td className="py-3">
                    {editingId === org.id ? (
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as PlanType)}
                        className="rounded-lg border border-indigo-400 bg-white px-2 py-1 text-xs dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                      </select>
                    ) : (
                      org.plan === "pro" ? <Badge variant="pro">Pro</Badge> : <Badge variant="default">Free</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === org.id ? (
                      <select
                        value={editStatus ?? ""}
                        onChange={(e) => setEditStatus(e.target.value as SubStatus)}
                        className="rounded-lg border border-indigo-400 bg-white px-2 py-1 text-xs dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="active">active</option>
                        <option value="trialing">trialing</option>
                        <option value="past_due">past_due</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    ) : (
                      getStatusBadge(org.subscription_status, org.plan)
                    )}
                  </td>
                  <td className="py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {org.stripe_customer_id ? `${org.stripe_customer_id.slice(0, 14)}...` : "-"}
                  </td>
                  <td className="py-3 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(org.created_at)}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === org.id ? (
                        <>
                          <button
                            onClick={() => saveSubscription(org.id)}
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
                        <button
                          onClick={() => startEdit(org)}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">{t("subscriptions.empty")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
