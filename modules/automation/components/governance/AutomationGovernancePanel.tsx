import {
  AUTOMATION_GOVERNANCE_MAP,
  ERP_AUTOMATION_GOVERNANCE_SUMMARY,
  ERP_AUTOMATION_GOVERNANCE_VERSION,
} from "@/lib/erp-core/events/automation/automation-governance";

export function AutomationGovernancePanel() {
  const active = AUTOMATION_GOVERNANCE_MAP.filter((g) => g.status === "active");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Version {ERP_AUTOMATION_GOVERNANCE_VERSION} — {ERP_AUTOMATION_GOVERNANCE_SUMMARY.activeRules} règles
        actives, {ERP_AUTOMATION_GOVERNANCE_SUMMARY.bloc3CrossDomainRules} cross-domain Bloc 3. Règles libres
        interdites.
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Règle</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {active.map((row) => (
              <tr key={row.ruleKey} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{row.ruleKey}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600">{row.eventPattern}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.actionKey}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{row.runtimeScope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
