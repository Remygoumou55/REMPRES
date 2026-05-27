import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertExecutiveDashboardRead } from "@/modules/executive-dashboard/server";
import { getLast12MonthsSales } from "@/lib/server/sales-monthly";
import {
  generateForecast,
  getRSquaredLabel,
  getTrendLabel,
  linearRegression,
} from "@/lib/utils/forecast";
import { PageHeader } from "@/components/ui/page-header";
import { ForecastPageClient } from "@/components/executive/ForecastPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExecutivePrevisionPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertExecutiveDashboardRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  const salesData = await getLast12MonthsSales();

  const points = salesData.months.map((m, i) => ({ x: i + 1, y: m.revenue_gnf }));
  const regression = linearRegression(points);
  const forecasts = generateForecast(salesData.months, 3);
  const trend = getTrendLabel(regression.slope);
  const reliability = getRSquaredLabel(regression.r_squared);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Prévisions CA"
        subtitle="Régression linéaire sur les 12 derniers mois — horizon 3 mois"
        breadcrumbs={
          <Link
            href="/dashboard/executive"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Centre exécutif
          </Link>
        }
      />
      <ForecastPageClient
        historicalMonths={salesData.months}
        forecastMonths={forecasts}
        regression={regression}
        trend={trend}
        reliability={reliability}
        stats={{
          total_12m: salesData.total_12m,
          avg_monthly: salesData.avg_monthly,
          best_month: salesData.best_month,
          worst_month: salesData.worst_month,
        }}
      />
    </div>
  );
}
