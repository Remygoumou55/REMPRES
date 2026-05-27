import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  ACTION_CATALOG,
  DEPT_BADGE_COLORS,
  TRIGGER_CATALOG,
} from "@/lib/constants/automation";
import { listExecutionLogs } from "@/lib/server/automation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function statusBadge(status: string) {
  if (status === "success") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
        Succès
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        Échec
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
      Ignoré
    </span>
  );
}

export default async function AdminAutomationHistoryPage() {
  const logs = await listExecutionLogs({ limit: 100 });

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Historique des exécutions"
        subtitle="Journal des règles déclenchées"
      />

      {logs.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ClipboardList className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune exécution enregistrée</p>
          <p className="max-w-sm text-xs">
            Les règles actives apparaîtront ici lors de leur déclenchement.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">Date / Heure</th>
                <th className="p-3">Règle</th>
                <th className="p-3">Déclencheur</th>
                <th className="p-3">Action</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Erreur</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dept =
                  TRIGGER_CATALOG.find((t) => t.type === log.trigger_type)?.department ?? "—";
                const deptClass = DEPT_BADGE_COLORS[dept] ?? "bg-gray-100 text-gray-700";
                const actionLabel =
                  ACTION_CATALOG.find((a) => a.type === log.action_type)?.label ??
                  log.action_type;
                const err =
                  log.error_message && log.error_message.length > 50
                    ? `${log.error_message.slice(0, 50)}…`
                    : log.error_message;
                return (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-600">
                      {new Date(log.executed_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-3 font-semibold text-darktext">{log.rule_name}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deptClass}`}
                      >
                        {dept}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                        {actionLabel}
                      </span>
                    </td>
                    <td className="p-3">{statusBadge(log.status)}</td>
                    <td className="p-3 text-xs text-gray-500">{err ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
