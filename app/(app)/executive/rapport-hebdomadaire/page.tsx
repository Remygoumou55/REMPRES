import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertExecutiveDashboardRead } from "@/modules/executive-dashboard/server";
import {
  getISOWeek,
  getISOWeekYear,
  listRecentIsoWeeks,
} from "@/lib/executive/week-utils";
import { PageHeader } from "@/components/ui/page-header";
import { WeeklyReportPageClient } from "@/components/executive/WeeklyReportPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExecutiveWeeklyReportPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertExecutiveDashboardRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = getISOWeekYear(now);
  const recentWeeks = listRecentIsoWeeks(4, now);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Rapport hebdomadaire"
        subtitle="Synthèse de toutes les activités"
        breadcrumbs={
          <Link
            href="/dashboard/executive"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour centre exécutif
          </Link>
        }
      />
      <WeeklyReportPageClient
        currentWeek={currentWeek}
        currentYear={currentYear}
        recentWeeks={recentWeeks}
      />
    </div>
  );
}
