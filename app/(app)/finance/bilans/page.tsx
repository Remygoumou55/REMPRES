import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listRecentMonthlySummaries } from "@/lib/server/finance-monthly-report";
import { PageHeader } from "@/components/ui/page-header";
import { MonthlyBilansClient } from "@/components/finance/MonthlyBilansClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinanceBilansPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const now = new Date();
  const summaries = await listRecentMonthlySummaries(
    6,
    now.getFullYear(),
    now.getMonth() + 1,
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Bilans mensuels"
        subtitle="Rapports financiers par période"
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
      <MonthlyBilansClient summaries={summaries} />
    </div>
  );
}
