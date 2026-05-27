import { PageHeader } from "@/components/ui/page-header";
import { RulesPageClient } from "@/components/automation/RulesPageClient";
import { listRules } from "@/lib/server/automation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAutomationRulesPage() {
  const result = await listRules();
  const totalExecutions = result.data.reduce((s, r) => s + r.execution_count, 0);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Règles d'automation"
        subtitle="Automatisez les processus métier — déclencheur, condition et action"
      />
      <RulesPageClient
        rules={result.data}
        activeCount={result.active_count}
        totalExecutions={totalExecutions}
      />
    </div>
  );
}
