import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { buildOpsOperationalAnalytics } from "@/modules/operations/server/services/ops-analytics-service";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";
import { OpsReportGenerateButton } from "@/modules/operations/components/workflows/OpsReportGenerateButton";

export default async function OperationsReportingPage() {
  const supabase = getSupabaseServerClient();
  const analytics = await buildOpsOperationalAnalytics(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Reporting Operations"
        subtitle="Rapport opérationnel live — émis sur le bus via ops.report.generated."
      />
      <OpsReportGenerateButton />
      <OperationsSectionPanel title={`Rapport ${analytics.reportId}`}>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-gray-500">Backlog tâches</dt>
            <dd className="font-semibold">{analytics.tasks.backlog}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Tâches clôturées (mois)</dt>
            <dd className="font-semibold">{analytics.tasks.doneThisMonth}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Workflows en revue</dt>
            <dd className="font-semibold">{analytics.workflows.inReview}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Taux livraison</dt>
            <dd className="font-semibold">{analytics.delivery.completionRatePct}%</dd>
          </div>
        </dl>
      </OperationsSectionPanel>
    </div>
  );
}
