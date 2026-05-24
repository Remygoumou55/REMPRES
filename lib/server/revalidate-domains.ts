import { revalidateTag } from "next/cache";
import {
  revalidateAdminAi,
  revalidateAdminArchives,
  revalidateAdminAutomation,
  revalidateAdminCloud,
  revalidateAdminCompliance,
  revalidateAdminEcosystem,
  revalidateAdminGovernancePlatform,
  revalidateAdminMultitenant,
  revalidateAdminObservability,
  revalidateAdminPlatform,
  revalidateAdminResilience,
  revalidateClients,
  revalidateCrm,
  revalidateCrmVisualDashboard,
  revalidateDashboardFoundation,
  revalidateDepartmentDashboard,
  revalidateExecutiveDashboard,
  revalidateFinance,
  revalidateFinanceVisualDashboard,
  revalidateHrVisualDashboard,
  revalidateLogisticsVisualDashboard,
  revalidateLogistique,
  revalidateProduits,
  revalidateRH,
  revalidateVente,
} from "@/lib/cache/revalidation-map";
import { AI_CACHE_TAGS } from "@/modules/ai/constants/cache-tags";
import { ANALYTICS_CACHE_TAGS } from "@/modules/analytics/constants/cache-tags";
import { AUTOMATION_CACHE_TAGS } from "@/modules/automation/constants/cache-tags";
import { COMPLIANCE_CACHE_TAGS } from "@/modules/compliance/constants/cache-tags";
import { ECOSYSTEM_CACHE_TAGS } from "@/modules/ecosystem/constants/cache-tags";
import { GOVERNANCE_PLATFORM_CACHE_TAGS } from "@/modules/governance-platform/constants/cache-tags";
import { INFRASTRUCTURE_CACHE_TAGS } from "@/modules/infrastructure/constants/cache-tags";
import { CLOUD_CACHE_TAGS } from "@/modules/cloud/constants/cache-tags";
import { MULTITENANT_CACHE_TAGS } from "@/modules/multitenant/constants/cache-tags";
import { OBSERVABILITY_CACHE_TAGS } from "@/modules/observability/constants/cache-tags";
import { PLATFORM_CACHE_TAGS } from "@/modules/platform/constants/cache-tags";
import { RESILIENCE_CACHE_TAGS } from "@/modules/resilience/constants/cache-tags";
import { DASHBOARD_FOUNDATION_CACHE_TAGS } from "@/modules/dashboard-system/constants";
import { EXECUTIVE_DASHBOARD_CACHE_TAGS } from "@/modules/executive-dashboard/constants";
import { ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS } from "@/modules/admin-platform-dashboard/constants";
import { DEPARTMENT_DASHBOARDS_CACHE_TAGS } from "@/modules/department-dashboards/constants";
import { HR_VISUAL_CACHE_TAGS } from "@/modules/department-dashboards/hr/constants";

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag);
  } catch {
    /* no-op hors boundary Next */
  }
}

export function revalidateVenteClientsScope(_params?: {
  clientId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  void revalidateClients({ clientId: _params?.clientId });
}

export function revalidateVenteProductsScope(_params?: {
  productId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  void revalidateProduits({ productId: _params?.productId });
}

export function revalidateVenteSalesScope(_params?: {
  saleId?: string | null;
  includeDashboard?: boolean;
}) {
  void revalidateVente({ saleId: _params?.saleId });
}

export function revalidateCrmScope(params?: { includeDashboard?: boolean }) {
  void params;
  void revalidateCrm();
}

export function revalidateLogisticsScope(params?: { includeDashboard?: boolean }) {
  void params;
  void revalidateLogistique();
}

export function revalidateFinanceScope(params?: { includeDashboard?: boolean }) {
  void params;
  void revalidateFinance();
}

export function revalidateRhScope(params?: { includeDashboard?: boolean }) {
  void params;
  void revalidateRH();
  safeRevalidateTag(ANALYTICS_CACHE_TAGS.rhDeptKpis);
  safeRevalidateTag(ANALYTICS_CACHE_TAGS.rhFoundation);
}

export function revalidateInfrastructureScope() {
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.analyticsOrchestration);
}

export function revalidateAiScope() {
  void revalidateAdminAi();
  safeRevalidateTag(AI_CACHE_TAGS.overview);
  safeRevalidateTag(AI_CACHE_TAGS.insights);
  safeRevalidateTag(AI_CACHE_TAGS.recommendations);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateEcosystemScope() {
  void revalidateAdminEcosystem();
  safeRevalidateTag(ECOSYSTEM_CACHE_TAGS.overview);
  safeRevalidateTag(ECOSYSTEM_CACHE_TAGS.partners);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidatePlatformScope() {
  void revalidateAdminPlatform();
  safeRevalidateTag(PLATFORM_CACHE_TAGS.overview);
  safeRevalidateTag(PLATFORM_CACHE_TAGS.marketplace);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateResilienceScope() {
  void revalidateAdminResilience();
  safeRevalidateTag(RESILIENCE_CACHE_TAGS.overview);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateGovernancePlatformScope() {
  void revalidateAdminGovernancePlatform();
  safeRevalidateTag(GOVERNANCE_PLATFORM_CACHE_TAGS.overview);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateCloudScope() {
  void revalidateAdminCloud();
  safeRevalidateTag(CLOUD_CACHE_TAGS.overview);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateMultitenantScope() {
  void revalidateAdminMultitenant();
  safeRevalidateTag(MULTITENANT_CACHE_TAGS.overview);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateObservabilityScope() {
  void revalidateAdminObservability();
  safeRevalidateTag(OBSERVABILITY_CACHE_TAGS.overview);
  safeRevalidateTag(OBSERVABILITY_CACHE_TAGS.health);
  safeRevalidateTag(OBSERVABILITY_CACHE_TAGS.incidents);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateComplianceScope() {
  void revalidateAdminCompliance();
  safeRevalidateTag(COMPLIANCE_CACHE_TAGS.overview);
  safeRevalidateTag(COMPLIANCE_CACHE_TAGS.periods);
  safeRevalidateTag(COMPLIANCE_CACHE_TAGS.riskSignals);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateAutomationScope() {
  void revalidateAdminAutomation();
  safeRevalidateTag(AUTOMATION_CACHE_TAGS.overview);
  safeRevalidateTag(AUTOMATION_CACHE_TAGS.workflowRuns);
  safeRevalidateTag(AUTOMATION_CACHE_TAGS.schedules);
  safeRevalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
}

export function revalidateAdminArchivesScope() {
  void revalidateAdminArchives();
}

export function revalidateDashboardFoundationScope(params?: { deptKeys?: readonly string[] }) {
  void revalidateDashboardFoundation(params?.deptKeys);
  safeRevalidateTag(DASHBOARD_FOUNDATION_CACHE_TAGS.root);
  for (const k of params?.deptKeys ?? []) {
    safeRevalidateTag(DASHBOARD_FOUNDATION_CACHE_TAGS.deptKpis(k));
  }
}

export function revalidateExecutiveDashboardScope() {
  void revalidateExecutiveDashboard();
  safeRevalidateTag(EXECUTIVE_DASHBOARD_CACHE_TAGS.root);
  safeRevalidateTag(EXECUTIVE_DASHBOARD_CACHE_TAGS.globalSnapshot);
}

export function revalidateAdminPlatformDashboardScope() {
  void revalidateAdminPlatform();
  safeRevalidateTag(ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS.root);
  safeRevalidateTag(ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS.hub);
}

export function revalidateDepartmentDashboardsScope(params: { deptKey: string }) {
  void revalidateDepartmentDashboard(params.deptKey);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.root);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.vertical(params.deptKey));
}

export function revalidateHrVisualDashboardScope() {
  void revalidateHrVisualDashboard();
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.root);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.vertical("rh"));
  safeRevalidateTag(HR_VISUAL_CACHE_TAGS.root);
  safeRevalidateTag(HR_VISUAL_CACHE_TAGS.snapshot);
}

export function revalidateFinanceVisualDashboardScope() {
  void revalidateFinanceVisualDashboard();
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.root);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.vertical("finance"));
}

export function revalidateCrmVisualDashboardScope() {
  void revalidateCrmVisualDashboard();
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.root);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.vertical("vente"));
}

export function revalidateLogisticsVisualDashboardScope() {
  void revalidateLogisticsVisualDashboard();
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.root);
  safeRevalidateTag(DEPARTMENT_DASHBOARDS_CACHE_TAGS.vertical("logistique"));
}
