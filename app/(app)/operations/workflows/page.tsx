import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { OpsWorkflowTransitionButton } from "@/modules/operations/components/workflows/OpsWorkflowTransitionButton";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";

export default async function OperationsWorkflowsPage() {
  const supabase = getSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("erp_ops_workflows")
    .select("id,workflow_code,subject_type,status,current_step_key,updated_at")
    .order("updated_at", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Workflows"
        subtitle="Cycle pending → active → review → approved → closed, avec étapes traçables."
      />
      <OperationsSectionPanel title="Instances workflow">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Sujet</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium">Étape</th>
                <th className="border-b px-3 py-2 font-medium">Transition</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs">{w.workflow_code}</td>
                  <td className="px-3 py-2.5 capitalize">{w.subject_type}</td>
                  <td className="px-3 py-2.5 capitalize">{w.status}</td>
                  <td className="px-3 py-2.5 text-xs">{w.current_step_key ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <OpsWorkflowTransitionButton workflowId={w.id} status={w.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OperationsSectionPanel>
    </div>
  );
}
