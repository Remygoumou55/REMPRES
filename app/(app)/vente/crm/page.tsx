import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { ROUTES } from "@/lib/constants/routes";
import { CRM_NAV } from "@/modules/crm/constants/nav";
import { getCrmOperationalOverview } from "@/modules/crm/server/services/crm-overview";
import { CrmMetricCard } from "@/modules/crm/ui/cards/CrmMetricCard";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmHubPage() {
  const supabase = getSupabaseServerClient();
  const overview = await getCrmOperationalOverview(supabase);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="CRM & vente"
        subtitle="Pipeline commercial, devis, activités et prévisions, en lien avec les clients, la vente et la logistique."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.crmVisual}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 shadow-sm transition hover:bg-indigo-100"
            >
              Vue analytique commerciale
            </Link>
            <Link
              href="/vente/dashboard"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
            >
              Pilotage département vente
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <CrmMetricCard label="Leads actifs" value={overview.activeLeads} hint="statuts ouverts" />
        <CrmMetricCard label="Opportunités" value={overview.openOpportunities} />
        <CrmMetricCard label="Devis ouverts" value={overview.openQuotes} hint="brouillon / envoyé" />
        <CrmMetricCard label="Activités à faire" value={overview.openActivities} />
        <CrmMetricCard label="Pipeline pondéré" value={formatMoneyGnf(overview.weightedPipelineGnf)} />
      </div>

      <CrmSectionPanel title="Accès rapide" description="Parcours CRM : leads, opportunités, devis et activités.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRM_NAV.filter((x) => x.href !== "/vente/crm").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="card flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-indigo-400/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-darktext">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </CrmSectionPanel>

      <CrmSectionPanel
        title="Liens transverses"
        description="Accès direct aux ventes, au pilotage financier et aux livraisons."
      >
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/vente/nouvelle-vente" className="font-medium text-primary hover:underline">
            Nouvelle vente
          </Link>
          <Link href="/finance/enterprise" className="font-medium text-primary hover:underline">
            Pilotage financier
          </Link>
          <Link href="/logistique/livraisons" className="font-medium text-primary hover:underline">
            Livraisons
          </Link>
        </div>
      </CrmSectionPanel>
    </div>
  );
}
