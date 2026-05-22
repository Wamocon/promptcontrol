import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { formatDate, formatCost } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "API-Aufrufe", value: totalCalls, icon: Activity, color: "text-indigo-600" },
          { label: "Ø Latenz", value: `${avgLatency}ms`, icon: Clock, color: "text-blue-600" },
          { label: "Gesamtkosten", value: formatCost(totalCost), icon: Coins, color: "text-green-600" },
          { label: "Fehler", value: errorCount, icon: XCircle, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
              </div>
              <div className={`rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Log table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("date")}</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("prompt")}</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("latency")}</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("tokens")}</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("cost")}</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {log.prompt_slug}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {log.latency_ms}ms
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {log.input_tokens + log.output_tokens}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatCost(Number(log.cost_usd))}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? (
                        <Badge variant="success">OK</Badge>
                      ) : (
                        <Badge variant="danger">Fehler</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
          {t("retention")}
        </div>
      </Card>
    </div>
  );
}
