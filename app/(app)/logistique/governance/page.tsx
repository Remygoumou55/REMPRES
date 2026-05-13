import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isSuperAdmin } from "@/lib/server/permissions";
import { LOGISTICS_APPROVAL_ENTITY_TYPES } from "@/modules/logistics/constants/approval-entities";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";

export default async function LogistiqueGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const superAdmin = await isSuperAdmin(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Gouvernance logistique"
        subtitle="Workflows sensibles et audit — alignés sur les systèmes governance existants."
      />

      <LogisticsSectionPanel title="Entités d’approbation (référence)">
        <ul className="grid gap-2 font-mono text-xs text-gray-800 sm:grid-cols-2">
          {Object.values(LOGISTICS_APPROVAL_ENTITY_TYPES).map((t) => (
            <li key={t} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
              {t}
            </li>
          ))}
        </ul>
      </LogisticsSectionPanel>

      <LogisticsSectionPanel title="Centre d’approbation">
        {superAdmin ? (
          <Link
            href="/admin/approvals?department=logistics"
            className="inline-flex rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Ouvrir les approbations (filtre logistics)
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Les décisions d’approbation sont réservées aux administrateurs. Les équipes logistiques préparent les dossiers
            dans les écrans Achats / Livraisons.
          </p>
        )}
      </LogisticsSectionPanel>

      <LogisticsSectionPanel title="Audit immutable">
        {superAdmin ? (
          <Link
            href="/admin/audit?department=logistics"
            className="inline-flex rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Registre governance_audit_events
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Le registre d’audit détaillé est réservé aux super administrateurs. Les mouvements de stock restent
            traçables dans logistique / mouvements.
          </p>
        )}
      </LogisticsSectionPanel>
    </div>
  );
}
