import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default function FinanceEnterpriseReportingPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reporting financier"
        subtitle="Accès aux exports et restitutions : pilotage CFO, grand livre et trésorerie."
      />

      <SectionPanel
        title="Exports opérationnels"
        description="Les exports détaillés (CSV, PDF) sont disponibles depuis le pilotage CFO et les écrans comptables dédiés."
      >
        <ul className="space-y-3 text-sm text-gray-700">
          <li>
            <Link href="/finance" className="font-medium text-primary hover:underline">
              Pilotage CFO — exports et analyses
            </Link>
          </li>
          <li>
            <span className="font-medium text-darktext">Grand livre & balance</span>
            {" — "}
            <Link href="/finance/enterprise/grand-livre" className="text-primary hover:underline">
              Consulter le grand livre
            </Link>
            {" · "}
            <Link href="/finance/enterprise/balance" className="text-primary hover:underline">
              Balance
            </Link>
          </li>
          <li>
            <span className="font-medium text-darktext">Trésorerie</span>
            {" — "}
            <Link href="/finance/enterprise/tresorerie" className="text-primary hover:underline">
              Suivi des soldes quotidiens
            </Link>
          </li>
        </ul>
      </SectionPanel>
    </div>
  );
}
