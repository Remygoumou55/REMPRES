import type { AutomationTraceEntry } from "@/lib/erp-core/events/automation/automation-trace-log";

export function AutomationTracePanel({ traces }: { traces: readonly AutomationTraceEntry[] }) {
  if (traces.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
        Aucune exécution récente en mémoire — déclencher un événement métier pour alimenter le moteur.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Heure</th>
            <th className="px-4 py-3">Règle</th>
            <th className="px-4 py-3">Événement</th>
            <th className="px-4 py-3">Résultat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...traces].reverse().map((t) => (
            <tr key={t.id} className="bg-white">
              <td className="px-4 py-2 text-xs text-gray-500">{t.at.slice(11, 19)}</td>
              <td className="px-4 py-2 font-mono text-xs">{t.ruleKey}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-600">{t.eventType}</td>
              <td className="px-4 py-2">
                <span
                  className={
                    t.outcome === "executed"
                      ? "text-emerald-700"
                      : t.outcome === "error"
                        ? "text-red-700"
                        : "text-amber-700"
                  }
                >
                  {t.outcome}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
