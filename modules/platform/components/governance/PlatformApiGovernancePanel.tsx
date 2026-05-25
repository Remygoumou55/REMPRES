import { PLATFORM_API_GOVERNANCE_REGISTRY } from "@/lib/platform/governance/api-governance-registry";

export function PlatformApiGovernancePanel() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">API</th>
            <th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Auth</th>
            <th className="px-4 py-3">Rate/min</th>
            <th className="px-4 py-3">Lifecycle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {PLATFORM_API_GOVERNANCE_REGISTRY.map((row) => (
            <tr key={row.apiKey} className="bg-white">
              <td className="px-4 py-2 font-mono text-xs">{row.apiKey}</td>
              <td className="px-4 py-2">{row.version}</td>
              <td className="px-4 py-2">{row.authMethod}</td>
              <td className="px-4 py-2 tabular-nums">{row.rateLimitPerMinute}</td>
              <td className="px-4 py-2">{row.lifecycleStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
