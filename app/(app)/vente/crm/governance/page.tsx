import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CRM_APPROVAL_ENTITY_TYPES } from "@/modules/crm/constants/approval-entities";
import { CRM_GOVERNANCE_DEPARTMENT_KEY } from "@/modules/crm/constants/module-keys";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default function VenteCrmGovernancePage() {
  const dept = CRM_GOVERNANCE_DEPARTMENT_KEY.toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gouvernance CRM"
        subtitle="Approvals (`approval_requests`) et audit (`governance_audit_events`) — département vente."
      />
      <CrmSectionPanel title="Types d’entités approval CRM">
        <ul className="list-disc space-y-1 pl-5 font-mono text-xs text-gray-700">
          {Object.values(CRM_APPROVAL_ENTITY_TYPES).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </CrmSectionPanel>
      <CrmSectionPanel title="Console super-admin">
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
          Filtre `department` selon conventions admin — ajuster si votre projet utilise une autre clé.
        </p>
      </CrmSectionPanel>
    </div>
  );
}
