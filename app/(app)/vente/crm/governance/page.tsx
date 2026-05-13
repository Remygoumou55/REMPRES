import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CRM_APPROVAL_ENTITY_TYPES } from "@/modules/crm/constants/approval-entities";
import { CRM_GOVERNANCE_DEPARTMENT_KEY } from "@/modules/crm/constants/module-keys";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default function VenteCrmGovernancePage() {
  const dept = CRM_GOVERNANCE_DEPARTMENT_KEY.toLowerCase();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Gouvernance CRM"
        subtitle="Demandes d’approbation et journal d’audit liés aux opérations commerciales du périmètre vente."
      />
      <CrmSectionPanel title="Types de demandes supervisées">
        <ul className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
          {Object.values(CRM_APPROVAL_ENTITY_TYPES).map((t) => (
            <li key={t} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 font-medium">
              {t}
            </li>
          ))}
        </ul>
      </CrmSectionPanel>
      <CrmSectionPanel title="Console administration">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/admin/approvals?department=${encodeURIComponent(dept)}`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 font-medium text-darktext shadow-sm hover:bg-gray-50"
          >
            Approbations
          </Link>
          <Link
            href={`/admin/audit?department=${encodeURIComponent(dept)}`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 font-medium text-darktext shadow-sm hover:bg-gray-50"
          >
            Audit
          </Link>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Les liens ouvrent la console avec le filtre département « vente » pour accélérer le traitement des dossiers.
        </p>
      </CrmSectionPanel>
    </div>
  );
}
