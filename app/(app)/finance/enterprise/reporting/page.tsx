import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { FINANCE_REPORT_IDS } from "@/modules/finance/reporting/report-registry";

export default function FinanceEnterpriseReportingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting financier"
        subtitle="Exports et restitutions — réutilise les pipelines existants sans duplication métier."
      />

      <SectionPanel
        title="Exports opérationnels"
        description="Les exports CSV/PDF détaillés restent sur le pilotage CFO et l’API dédiée."
      >
        <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/finance" className="font-medium text-primary hover:underline">
              Pilotage CFO — export avancé
            </Link>
          </li>
          <li>
            <span className="font-mono text-xs text-gray-500">{FINANCE_REPORT_IDS.generalLedger}</span> — via grand
            livre & balance (UI ci-dessus).
          </li>
          <li>
            <span className="font-mono text-xs text-gray-500">{FINANCE_REPORT_IDS.cashflowDaily}</span> — snapshots{" "}
            <Link href="/finance/enterprise/tresorerie" className="text-primary hover:underline">
              Trésorerie
            </Link>
            .
          </li>
        </ul>
      </SectionPanel>
    </div>
  );
}
