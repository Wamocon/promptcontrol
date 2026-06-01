import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { formatDate, formatCost } from "@/lib/utils";

import { Activity, Clock, Coins, XCircle } from "lucide-react";

export default async function LogsPage() {
  const t = await getTranslations("logs");
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("prompt_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Aggregate stats
  const totalCalls = logs?.length ?? 0;
  const avgLatency =
    logs && logs.length > 0
      ? Math.round(logs.reduce((a, l) => a + l.latency_ms, 0) / logs.length)
      : 0;
  const totalCost = logs?.reduce((a, l) => a + Number(l.cost_usd), 0) ?? 0;
  const errorCount = logs?.filter((l) => l.status === "error").length ?? 0;

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-t1">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-t3">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "API-Aufrufe", value: totalCalls, icon: Activity, color: "text-indigo-400", bg: "rgba(99,102,241,0.12)", glow: "rgba(99,102,241,0.22)" },
          { label: "Ø Latenz", value: `${avgLatency}ms`, icon: Clock, color: "text-cyan-400", bg: "rgba(34,211,238,0.12)", glow: "rgba(34,211,238,0.22)" },
          { label: "Gesamtkosten", value: formatCost(totalCost), icon: Coins, color: "text-emerald-400", bg: "rgba(16,185,129,0.12)", glow: "rgba(16,185,129,0.22)" },
          { label: "Fehler", value: errorCount, icon: XCircle, color: "text-rose-400", bg: "rgba(244,63,94,0.12)", glow: "rgba(244,63,94,0.22)" },
        ].map(({ label, value, icon: Icon, color, bg, glow }) => (
          <div key={label} className="card-hover panel p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-t3 uppercase tracking-wider">{label}</p>
              <div className={`rounded-xl p-2 ${color}`} style={{ background: bg, boxShadow: `0 0 20px ${glow}` }}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="metric-number text-t1">{value}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg-subtle)" }}>
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("date")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("prompt")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("latency")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("tokens")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("cost")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-t3 uppercase tracking-wider">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-t4">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-black/2 dark:hover:bg-white/2" style={{ borderColor: "var(--panel-border)" }}>
                    <td className="px-4 py-3 text-t3 whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-500">
                      {log.prompt_slug}
                    </td>
                    <td className="px-4 py-3 text-t2 text-xs">
                      {log.latency_ms}ms
                    </td>
                    <td className="px-4 py-3 text-t2 text-xs">
                      {log.input_tokens + log.output_tokens}
                    </td>
                    <td className="px-4 py-3 text-t2 text-xs">
                      {formatCost(Number(log.cost_usd))}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-emerald-500 bg-emerald-400/12 border border-emerald-400/20">OK</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-rose-500 bg-rose-400/12 border border-rose-400/20">Fehler</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs text-t4 border-t" style={{ borderColor: "var(--panel-border)" }}>
          {t("retention")}
        </div>
      </div>
    </div>
  );
}
