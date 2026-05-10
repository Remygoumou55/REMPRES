import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CRM_CUSTOMERS_ROUTE } from "@/modules/crm/customers";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default function VenteCrmClientsBridgePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients CRM"
        subtitle="Le référentiel clients unique reste le module Vente — pas de duplication de données."
      />
      <CrmSectionPanel title="Accès clients">
        <p className="text-sm text-gray-700">
          Gestion cycle de vie, archives et fiches détaillées : utilisez l’interface canonique clients.
        </p>
        <div className="mt-4">
          <Link
            href={CRM_CUSTOMERS_ROUTE}
            className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Ouvrir Clients Vente
          </Link>
        </div>
      </CrmSectionPanel>
    </div>
  );
}
