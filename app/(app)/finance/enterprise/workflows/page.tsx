import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isSuperAdmin } from "@/lib/server/permissions";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { FINANCE_APPROVAL_ENTITY_TYPES } from "@/modules/finance/constants/approval-entities";

export default async function FinanceEnterpriseWorkflowsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const superAdmin = await isSuperAdmin(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows & approbations"
        subtitle="Alignement avec `approval_requests` — entités finance typées côté domaine."
      />

      <SectionPanel title="Entités finance (référence)">
        <ul className="grid gap-2 font-mono text-xs text-gray-700 sm:grid-cols-2">
          {Object.values(FINANCE_APPROVAL_ENTITY_TYPES).map((id) => (
            <li key={id} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
              {id}
            </li>
          ))}
        </ul>
      </SectionPanel>

      <SectionPanel
        title="Centre d'approbation"
        description="Le traitement des décisions reste dans la console gouvernance (super admin)."
      >
        {superAdmin ? (
          <Link
            href="/admin/approvals?department=finance"
            className="inline-flex rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Ouvrir les approbations (filtre Finance)
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Les validations sensibles sont traitées par la direction. Contactez un administrateur pour le suivi des
            dossiers finance.
          </p>
        )}
      </SectionPanel>
    </div>
  );
}
