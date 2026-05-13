import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getFinanceCfoData } from "@/lib/server/finance-overview";
import { FinanceStatCard } from "@/modules/finance/ui/cards/FinanceStatCard";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { FINANCE_ANALYTICS_BRIDGE_VERSION } from "@/modules/finance/analytics/finance-kpi-bridge";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function FinanceEnterpriseAnalyticsPage() {
  const supabase = getSupabaseServerClient();
  const from = firstDayOfMonth();
  const to = today();
  const data = await getFinanceCfoData(supabase, {
    from,
    to,
    categoryIds: [],
    createdByUserId: null,
  });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Analytics finance"
        subtitle={`Pont analytics v${FINANCE_ANALYTICS_BRIDGE_VERSION} — KPI CFO du mois civil.`}
        actions={
          <Link
            href="/finance"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm hover:bg-gray-50"
          >
            Vue complète
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard
          label="CA net (mois)"
          value={`${Math.round(data.netSaleRevenue).toLocaleString("fr-FR")} GNF`}
        />
        <FinanceStatCard
          label="Dépenses (mois)"
          value={`${Math.round(data.totalExpenses).toLocaleString("fr-FR")} GNF`}
        />
        <FinanceStatCard
          label="Résultat"
          value={`${Math.round(data.profit).toLocaleString("fr-FR")} GNF`}
        />
        <FinanceStatCard
          label="Marge"
          value={data.marginPct != null ? `${data.marginPct.toFixed(1)} %` : "—"}
        />
      </div>

      <SectionPanel
        title="Séries temporelles"
        description="Les graphiques détaillés (Recharts) restent sur /finance pour éviter double chargement."
      >
        <p className="text-sm text-gray-600">
          Ouvrez le{" "}
          <Link href={`/finance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} className="text-primary hover:underline">
            pilotage CFO
          </Link>{" "}
          pour les courbes CA / dépenses et cashflow projeté.
        </p>
      </SectionPanel>
    </div>
  );
}
