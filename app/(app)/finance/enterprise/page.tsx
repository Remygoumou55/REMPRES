import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { FinanceEnterpriseHubCards } from "@/modules/finance/components/dashboard/FinanceEnterpriseHubCards";
import { FinanceStatCard } from "@/modules/finance/ui/cards/FinanceStatCard";
import { FinanceAccountingOverview } from "@/modules/finance/components/accounting/FinanceAccountingOverview";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { getFinanceEnterpriseOverview } from "@/modules/finance/server/services/finance-enterprise-overview";
import { listActiveFinanceAccounts } from "@/modules/finance/server/repositories/finance-accounts-repository";

export default async function FinanceEnterpriseHubPage() {
  const supabase = getSupabaseServerClient();
  const [overview, accounts] = await Promise.all([
    getFinanceEnterpriseOverview(supabase),
    listActiveFinanceAccounts(supabase),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Finance comptable & trésorerie"
        subtitle="Grand livre, facturation, trésorerie et contrôles : accès structuré aux travées comptables et au pilotage CFO."
        actions={
          <Link
            href="/finance"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
          >
            ← Pilotage CFO
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard label="Lots journal (brouillon)" value={overview.journalDraftCount} />
        <FinanceStatCard label="Lots comptabilisés" value={overview.journalPostedCount} />
        <FinanceStatCard label="Créances ouvertes (factures)" value={overview.arOpenCount} />
        <FinanceStatCard label="Paiements (mois courant)" value={overview.paymentsMonthCount} />
      </div>

      <FinanceAccountingOverview accountCount={accounts.length} />

      <SectionPanel title="Accès métier" description="Raccourcis vers les écrans comptables, la trésorerie et les rapports.">
        <FinanceEnterpriseHubCards />
      </SectionPanel>
    </div>
  );
}
