import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listFinanceJournalBatches } from "@/modules/finance/server/repositories/finance-journal-repository";
import { FinanceJournalTable } from "@/modules/finance/components/journal/FinanceJournalTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterpriseJournalPage() {
  const supabase = getSupabaseServerClient();
  const batches = await listFinanceJournalBatches(supabase, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal comptable"
        subtitle="Lots d'écritures — création et validation progressive (post via RPC `post_finance_journal_batch`)."
      />
      <SectionPanel title="Lots récents" description="Tri par date de pièce et création.">
        <FinanceJournalTable rows={batches} />
      </SectionPanel>
    </div>
  );
}
