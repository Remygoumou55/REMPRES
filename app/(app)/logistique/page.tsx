import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { LOGISTICS_NAV } from "@/modules/logistics/constants/nav";
import { LogisticsMetricCard } from "@/modules/logistics/ui/cards/LogisticsMetricCard";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { getLogisticsOperationalOverview } from "@/modules/logistics/server/services/logistics-overview";

export default async function LogistiqueHubPage() {
  const supabase = getSupabaseServerClient();
  const overview = await getLogisticsOperationalOverview(supabase);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Logistique Enterprise"
        subtitle="Supply chain : entrepôts, stocks, achats, livraisons — aligné catalogue produits (`products`)."
        actions={
          <Link
            href="/logistique/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
          >
            Accueil gouvernance département
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <LogisticsMetricCard label="Entrepôts actifs" value={overview.warehouseCount} />
        <LogisticsMetricCard label="Fournisseurs actifs" value={overview.supplierCount} />
        <LogisticsMetricCard label="Commandes ouvertes" value={overview.openPurchaseOrders} />
        <LogisticsMetricCard label="Livraisons en cours" value={overview.activeDeliveries} />
        <LogisticsMetricCard
          label="Alertes stock"
          value={overview.stockAlertRows}
          hint="≤ seuil catalogue"
        />
      </div>

      <LogisticsSectionPanel title="Accès rapide" description="Modules opérationnels supply-chain.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOGISTICS_NAV.filter((x) => x.href !== "/logistique").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="card flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-emerald-400/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-darktext">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </LogisticsSectionPanel>

      <LogisticsSectionPanel
        title="Intégrations"
        description="Les ventes continuent de piloter `products.stock_quantity` ; les positions multi-entrepôt vivent dans `logistics_inventory_balances`."
      >
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/vente/produits" className="font-medium text-primary hover:underline">
            Catalogue produits
          </Link>
          <Link href="/finance/enterprise" className="font-medium text-primary hover:underline">
            Finance Enterprise
          </Link>
        </div>
      </LogisticsSectionPanel>
    </div>
  );
}
