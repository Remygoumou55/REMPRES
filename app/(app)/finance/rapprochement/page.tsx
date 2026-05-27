import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import {
  getOrCreateReconciliation,
  listReconciliations,
} from "@/lib/server/bank-reconciliation";
import { PageHeader } from "@/components/ui/page-header";
import { ReconciliationForm } from "@/components/finance/ReconciliationForm";
import { ReconciliationHistory } from "@/components/finance/ReconciliationHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { month?: string; year?: string };
};

function parsePeriod(
  searchParams: Props["searchParams"],
): { month: number; year: number } {
  const now = new Date();
  const m = Number(searchParams?.month);
  const y = Number(searchParams?.year);
  if (Number.isInteger(m) && m >= 1 && m <= 12 && Number.isInteger(y) && y >= 2020) {
    return { month: m, year: y };
  }
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default async function FinanceRapprochementPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const { month, year } = parsePeriod(searchParams);

  const [current, history] = await Promise.all([
    getOrCreateReconciliation(month, year, user.id),
    listReconciliations(12),
  ]);

  return (
    <div className="page-wrapper space-y-8">
      <PageHeader
        title="Rapprochement bancaire"
        subtitle="Comparaison solde système vs banque"
        breadcrumbs={
          <Link
            href="/finance"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour Finance
          </Link>
        }
      />

      <ReconciliationForm reconciliation={current} />
      <ReconciliationHistory history={history} activeId={current.id} />
    </div>
  );
}
