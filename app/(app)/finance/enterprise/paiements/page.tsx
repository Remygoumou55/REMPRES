import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listFinancePaymentAllocations } from "@/modules/finance/server/repositories/finance-payments-repository";
import { FinancePaymentsTable } from "@/modules/finance/components/payments/FinancePaymentsTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterprisePaymentsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listFinancePaymentAllocations(supabase, 150);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Paiements"
        subtitle="Allocations enregistrées — lien optionnel vers factures, dépenses ou financial_transactions."
      />
      <SectionPanel title="Flux entrants / sortants">
        <FinancePaymentsTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
