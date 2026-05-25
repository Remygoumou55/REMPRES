import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listAutomationWorkflowDefinitions } from "@/modules/automation/server/repositories/automation-definitions-repository";

export default async function AdminAutomationWorkflowsPage() {
  const supabase = getSupabaseServerClient();
  const defs = await listAutomationWorkflowDefinitions(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Workflows automation"
        subtitle="Définitions versionnées — exécutions pilotées par le moteur P6."
      />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {defs.map((d) => (
              <tr key={d.workflow_key} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{d.workflow_key}</td>
                <td className="px-4 py-2">{d.domain_key}</td>
                <td className="px-4 py-2">{d.label}</td>
                <td className="px-4 py-2">{d.is_active ? "oui" : "non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
