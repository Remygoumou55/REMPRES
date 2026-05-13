import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { loadGlobalGovernanceDashboard } from "@/lib/governance/dashboard/load-global-governance-dashboard";
import { GovernanceInsightsSection } from "@/components/governance/dashboard/GovernanceInsightsSection";
import { ActivitySummaryCard } from "@/components/governance/dashboard/ActivitySummaryCard";
import { SystemHealthSection } from "@/components/governance/dashboard/SystemHealthSection";
import { DepartmentHealthCard } from "@/components/governance/dashboard/DepartmentHealthCard";
import { DepartmentOverviewSection } from "@/components/governance/dashboard/DepartmentOverviewSection";
import { DepartmentActivitySection } from "@/components/governance/dashboard/DepartmentActivitySection";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { ExecutiveGlobalHealthSection } from "@/components/governance/dashboard/sections/ExecutiveGlobalHealthSection";
import { GovernanceRiskSection } from "@/components/governance/dashboard/sections/GovernanceRiskSection";
import { ExecutiveWelcomeCenterSection } from "@/components/governance/dashboard/sections/ExecutiveWelcomeCenterSection";
import { ExecutiveAnalyticsSection } from "@/components/governance/dashboard/sections/ExecutiveAnalyticsSection";
import { ExecutiveDashboardLayout } from "@/components/executive/ExecutiveDashboardLayout";
import { ExecutiveInsightStack } from "@/components/executive/ExecutiveInsightStack";

export default async function AdminGlobalDashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const [dashboard, locale] = await Promise.all([loadGlobalGovernanceDashboard(), getRequestLocale()]);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);

  return (
    <ExecutiveDashboardLayout
      header={
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">{t("governance.dashboard.global.title")}</h1>
            <p className="mt-1 text-sm text-gray-600">{t("governance.dashboard.global.subtitle")}</p>
          </section>
        </>
      }
      top={
        <>
          <ExecutiveWelcomeCenterSection
            t={t}
            activeDepartments={dashboard.enterprise.activeDepartments}
            unresolvedAlerts={dashboard.governance.unresolvedAlerts}
            pendingApprovals={dashboard.governance.pendingApprovals}
          />
          <ExecutiveGlobalHealthSection
            titleByKey={t}
            activeDepartments={dashboard.enterprise.activeDepartments}
            activeUsers={dashboard.enterprise.activeUsers}
            sensitiveActions24h={dashboard.enterprise.sensitiveActions24h}
            unresolvedAlerts={dashboard.governance.unresolvedAlerts}
          />
        </>
      }
      left={
        <>
          <DepartmentOverviewSection departments={dashboard.departments} />
          <DepartmentActivitySection recentActivity={dashboard.recentActivity} />
          <ActivitySummaryCard
            activityEvents24h={dashboard.enterprise.activityEvents24h}
            activeUsers={dashboard.enterprise.activeUsers}
          />
          <DepartmentHealthCard departments={dashboard.departments} />
        </>
      }
      right={
        <ExecutiveInsightStack>
          <ExecutiveAnalyticsSection t={t} />
          <GovernanceRiskSection
            titleByKey={t}
            unresolvedAlerts={dashboard.governance.unresolvedAlerts}
            pendingApprovals={dashboard.governance.pendingApprovals}
            criticalAuditEvents7d={dashboard.governance.criticalAuditEvents7d}
            securityAuditEvents7d={dashboard.governance.securityAuditEvents7d}
          />
          <GovernanceInsightsSection
            activityEvents24h={dashboard.enterprise.activityEvents24h}
            activeUsers={dashboard.enterprise.activeUsers}
          />
          <SystemHealthSection health={dashboard.systemHealth} />
        </ExecutiveInsightStack>
      }
    />
  );
}
