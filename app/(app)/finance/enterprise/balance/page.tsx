import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listFinanceTrialBalance } from "@/modules/finance/server/repositories/finance-trial-balance-repository";
import { FinanceTrialBalanceTable } from "@/modules/finance/components/trial-balance/FinanceTrialBalanceTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterpriseTrialBalancePage() {
  const supabase = getSupabaseServerClient();
  const rows = await listFinanceTrialBalance(supabase, 500);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Balance générale"
        subtitle="Synthèse débits / crédits par compte (écritures postées)."
      />
      <SectionPanel title="Balance">
        <FinanceTrialBalanceTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
