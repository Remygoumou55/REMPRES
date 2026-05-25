import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  buildSupplyOperationalAnalytics,
  generateSupplyOperationalReport,
} from "@/modules/logistics/server/services/logistics-analytics-service";
import { LogisticsMetricCard } from "@/modules/logistics/ui/cards/LogisticsMetricCard";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";

export default async function LogistiqueReportingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const analytics = await buildSupplyOperationalAnalytics(supabase);
  await generateSupplyOperationalReport(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reporting logistique"
        subtitle="Stocks, achats et mouvements — indicateurs live supply chain."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LogisticsMetricCard
          label="Positions SKU"
          value={analytics.inventory.skuPositions}
        />
        <LogisticsMetricCard
          label="Quantité totale"
          value={analytics.inventory.totalQtyOnHand}
        />
        <LogisticsMetricCard
          label="Valeur stock estimée"
          value={analytics.inventory.estimatedValueGnf.toLocaleString("fr-FR")}
        />
        <LogisticsMetricCard label="Alertes stock bas" value={analytics.inventory.lowStockAlerts} />
        <LogisticsMetricCard label="PO ouverts" value={analytics.procurement.openPoBacklog} />
        <LogisticsMetricCard
          label="Mouvements (mois)"
          value={analytics.movements.volumeThisMonth}
        />
      </div>
      <LogisticsSectionPanel title="Parcours opérationnels">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/logistique/stock" className="font-medium text-primary hover:underline">
            Positions stock
          </Link>
          <Link href="/logistique/mouvements" className="font-medium text-primary hover:underline">
            Journal mouvements
          </Link>
          <Link href="/logistique/achats" className="font-medium text-primary hover:underline">
            Pipeline achats
          </Link>
        </div>
      </LogisticsSectionPanel>
    </div>
  );
}
