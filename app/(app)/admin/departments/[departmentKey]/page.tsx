import { redirect } from "next/navigation";
import {
  DEPARTMENT_NAVIGATION,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { parseDepartmentKeySlug } from "@/lib/governance/sidebar-config";
import { DepartmentSwitcher } from "@/components/governance/layout/DepartmentSwitcher";
import { DepartmentSupervisorCard } from "@/components/governance/dashboard/DepartmentSupervisorCard";
import { loadGlobalGovernanceDashboard } from "@/lib/governance/dashboard/load-global-governance-dashboard";
import { DepartmentOverviewSection } from "@/components/governance/dashboard/DepartmentOverviewSection";
import { DepartmentActivitySection } from "@/components/governance/dashboard/DepartmentActivitySection";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { mapModuleToDepartment } from "@/lib/governance/analytics/activity-summary";

type PageProps = {
  params: { departmentKey: string };
};

function assertSupervisedDepartment(key: DepartmentKey): boolean {
  const nav = DEPARTMENT_NAVIGATION[key];
  return !nav.supervisionOnly && nav.routePrefixes.length > 0;
}

export default async function DepartmentSupervisionPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const departmentKey = parseDepartmentKeySlug(params.departmentKey);
  if (!departmentKey || !assertSupervisedDepartment(departmentKey)) {
    redirect("/admin/global-dashboard");
  }

  const [dashboard, locale] = await Promise.all([loadGlobalGovernanceDashboard(), getRequestLocale()]);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);
  const departmentMetrics = dashboard.departments.filter((d) => d.departmentKey === departmentKey);
  const departmentActivity = dashboard.recentActivity.filter(
    (event) => mapModuleToDepartment(event.module_key) === departmentKey,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {t("governance.supervision.departmentTitle")} - {DEPARTMENT_NAVIGATION[departmentKey].label}
          </h1>
          <p className="text-sm text-gray-600">
            {t("governance.supervision.departmentSubtitle")}
          </p>
        </div>
        <DepartmentSwitcher currentDepartmentKey={departmentKey} />
      </div>

      <DepartmentSupervisorCard departmentKey={departmentKey} />
      <DepartmentOverviewSection departments={departmentMetrics} />
      <DepartmentActivitySection recentActivity={departmentActivity} />
    </div>
  );
}
