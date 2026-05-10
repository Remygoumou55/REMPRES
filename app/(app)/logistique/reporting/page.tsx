import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { LOGISTICS_REPORT_IDS } from "@/modules/logistics/reporting/report-registry";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";

export default function LogistiqueReportingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reporting logistique" subtitle="Restitutions et packs analytiques (extensions BI)." />
      <LogisticsSectionPanel title="Identifiants standard">
        <ul className="space-y-2 font-mono text-xs text-gray-700">
          <li>{LOGISTICS_REPORT_IDS.stockPosition}</li>
          <li>{LOGISTICS_REPORT_IDS.movementsLedger}</li>
          <li>{LOGISTICS_REPORT_IDS.procurementPipeline}</li>
        </ul>
      </LogisticsSectionPanel>
      <LogisticsSectionPanel title="Exports" description="Les exports détaillés peuvent réutiliser les vues SQL et l’API métier sans duplication catalogue.">
        <Link href="/logistique/mouvements" className="text-sm font-medium text-primary hover:underline">
          Voir mouvements — base ledger
        </Link>
      </LogisticsSectionPanel>
    </div>
  );
}
