import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CRM_SALES_ORDERS_ROUTE } from "@/modules/crm/orders";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default function VenteCrmOrdersPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Commandes vente"
        subtitle="Historique des commandes : création, encaissements et suivi du cycle de vente, avec lien vers le CRM."
      />
      <CrmSectionPanel title="Historique ventes">
        <p className="text-sm text-gray-700">
          Utilisez le flux vente pour enregistrer une commande, suivre les encaissements et les étapes jusqu’à la clôture.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={CRM_SALES_ORDERS_ROUTE}
            className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Ouvrir historique ventes
          </Link>
          <Link
            href="/vente/nouvelle-vente"
            className="inline-flex rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-darktext shadow-sm transition hover:bg-gray-50"
          >
            Nouvelle vente
          </Link>
        </div>
      </CrmSectionPanel>
    </div>
  );
}
