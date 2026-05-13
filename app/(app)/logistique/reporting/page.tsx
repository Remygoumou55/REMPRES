import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { LOGISTICS_REPORT_IDS } from "@/modules/logistics/reporting/report-registry";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";

const REPORT_LABELS: Record<(typeof LOGISTICS_REPORT_IDS)[keyof typeof LOGISTICS_REPORT_IDS], string> = {
  [LOGISTICS_REPORT_IDS.stockPosition]: "Positions de stock et niveaux par site",
  [LOGISTICS_REPORT_IDS.movementsLedger]: "Grand livre des mouvements (entrées / sorties)",
  [LOGISTICS_REPORT_IDS.procurementPipeline]: "Pipeline des achats et commandes fournisseurs",
};

export default function LogistiqueReportingPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reporting logistique"
        subtitle="Restitutions analytiques : stocks, mouvements et achats, pour le pilotage supply chain."
      />
      <LogisticsSectionPanel title="Rapports standard" description="Pack analytique supply chain : stocks, mouvements et achats.">
        <ul className="space-y-2 text-sm text-gray-700">
          {Object.values(LOGISTICS_REPORT_IDS).map((id) => (
            <li key={id} className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 font-medium text-darktext">
              {REPORT_LABELS[id]}
            </li>
          ))}
        </ul>
      </LogisticsSectionPanel>
      <LogisticsSectionPanel title="Exports" description="Accédez aux données sources pour vos analyses détaillées.">
        <Link href="/logistique/mouvements" className="text-sm font-medium text-primary hover:underline">
          Consulter les mouvements
        </Link>
      </LogisticsSectionPanel>
    </div>
  );
}
