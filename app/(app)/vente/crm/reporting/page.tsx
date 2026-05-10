import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CRM_REPORT_DEFINITIONS } from "@/modules/crm/reporting/report-registry";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default function VenteCrmReportingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reporting commercial" subtitle="Registre métier CRM — brancher exports enterprise existants sur ces sources." />
      <CrmSectionPanel title="Jeux de données">
        <ul className="space-y-3">
          {CRM_REPORT_DEFINITIONS.map((r) => (
            <li key={r.key} className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <div className="font-semibold text-darktext">{r.label}</div>
              <div className="mt-1 font-mono text-xs text-gray-600">{r.source}</div>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-sm">
          <Link href="/vente/crm/pipeline" className="font-medium text-primary hover:underline">
            Voir pipeline pondéré
          </Link>
        </div>
      </CrmSectionPanel>
    </div>
  );
}
