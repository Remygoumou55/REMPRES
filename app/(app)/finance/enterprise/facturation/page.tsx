import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listFinanceArInvoices } from "@/modules/finance/server/repositories/finance-invoices-repository";
import { FinanceInvoicesTable } from "@/modules/finance/components/invoices/FinanceInvoicesTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterpriseInvoicingPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listFinanceArInvoices(supabase, 120);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturation (créances)"
        subtitle="Factures AR enterprise — rattachement clients et workflow d’approbation optionnel."
      />
      <SectionPanel title="Factures">
        <FinanceInvoicesTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
