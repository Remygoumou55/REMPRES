import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getISOWeek, getISOWeekYear } from "@/lib/executive/week-utils";
import { assertExecutiveDashboardRead } from "@/modules/executive-dashboard/server";
import { ExecutiveGlobalDashboard } from "@/modules/executive-dashboard/components/ExecutiveGlobalDashboard";

export const metadata = {
  title: "Centre exécutif — RemPres ERP",
};

export default async function ExecutiveDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  try {
    await assertExecutiveDashboardRead(user.id);
  } catch {
    redirect("/access-denied");
  }
  const now = new Date();
  return (
    <ExecutiveGlobalDashboard
      currentWeek={getISOWeek(now)}
      currentYear={getISOWeekYear(now)}
    />
  );
}
