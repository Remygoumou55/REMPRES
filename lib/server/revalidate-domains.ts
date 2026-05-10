import { revalidatePath, revalidateTag } from "next/cache";
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

function uniq(paths: readonly string[]): string[] {
  return Array.from(new Set(paths.filter(Boolean)));
}

function revalidateMany(paths: readonly string[]) {
  for (const p of uniq(paths)) {
    revalidatePath(p);
  }
}

export function revalidateVenteClientsScope(params?: {
  clientId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  const id = String(params?.clientId ?? "").trim();
  const paths = [
    "/vente/clients",
    id ? `/vente/clients/${id}` : "",
    params?.includeArchives ? "/vente/clients/archives" : "",
    params?.includeArchives ? "/admin/archives" : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateVenteProductsScope(params?: {
  productId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  const id = String(params?.productId ?? "").trim();
  const paths = [
    "/vente/produits",
    id ? `/vente/produits/${id}` : "",
    params?.includeArchives ? "/vente/produits/archives" : "",
    params?.includeArchives ? "/admin/archives" : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateVenteSalesScope(params?: {
  saleId?: string | null;
  includeDashboard?: boolean;
}) {
  const id = String(params?.saleId ?? "").trim();
  const paths = [
    "/vente/historique",
    id ? `/vente/historique/${id}` : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateCrmScope(params?: { includeDashboard?: boolean }) {
  const paths = [
    "/vente/crm",
    "/vente/crm/clients",
    "/vente/crm/leads",
    "/vente/crm/pipeline",
    "/vente/crm/opportunities",
    "/vente/crm/quotes",
    "/vente/crm/orders",
    "/vente/crm/activities",
    "/vente/crm/forecasting",
    "/vente/crm/analytics",
    "/vente/crm/reporting",
    "/vente/crm/governance",
    params?.includeDashboard ? "/dashboard" : "",
    params?.includeDashboard ? "/dept/vente" : "",
  ];
  revalidateMany(paths);
}

export function revalidateLogisticsScope(params?: { includeDashboard?: boolean }) {
  const paths = [
    "/logistique",
    "/logistique/dashboard",
    "/logistique/entrepots",
    "/logistique/stock",
    "/logistique/mouvements",
    "/logistique/fournisseurs",
    "/logistique/achats",
    "/logistique/livraisons",
    "/logistique/alertes",
    "/logistique/reporting",
    "/logistique/governance",
    params?.includeDashboard ? "/dashboard" : "",
    params?.includeDashboard ? "/dept/logistique" : "",
  ];
  revalidateMany(paths);
}

export function revalidateFinanceScope(params?: { includeDashboard?: boolean }) {
  const paths = [
    "/finance",
    "/finance/enterprise",
    "/finance/depenses",
    "/finance/dashboard",
    "/finance/comptabilite",
    "/finance/journal",
    "/finance/facturation",
    "/finance/tresorerie",
    params?.includeDashboard ? "/dashboard" : "",
    params?.includeDashboard ? "/dept/finance" : "",
  ];
  revalidateMany(paths);
}

export function revalidateRhScope(params?: { includeDashboard?: boolean }) {
  const paths = [
    "/rh",
    "/rh/presences",
    "/rh/conges",
    "/rh/contrats",
    "/rh/recrutement",
    params?.includeDashboard ? "/dashboard" : "",
    params?.includeDashboard ? "/dept/rh" : "",
  ];
  revalidateMany(paths);
  try {
    revalidateTag(ANALYTICS_CACHE_TAGS.rhDeptKpis);
    revalidateTag(ANALYTICS_CACHE_TAGS.rhFoundation);
  } catch {
    /* no-op si hors boundary Next */
  }
}

export function revalidateInfrastructureScope() {
  try {
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.analyticsOrchestration);
  } catch {
    /* no-op hors boundary Next */
  }
}

export function revalidateAiScope() {
  revalidateMany([
    "/admin/ai",
    "/admin/ai/insights",
    "/admin/ai/recommendations",
    "/admin/ai/predictive",
    "/admin/ai/forecasting",
    "/admin/ai/assistants",
    "/admin/ai/optimization",
    "/admin/ai/risk",
    "/admin/ai/observability",
    "/admin/ai/governance",
    "/admin/ai/recovery",
    "/admin/ai/monitoring",
  ]);
  try {
    revalidateTag(AI_CACHE_TAGS.overview);
    revalidateTag(AI_CACHE_TAGS.insights);
    revalidateTag(AI_CACHE_TAGS.recommendations);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateEcosystemScope() {
  revalidateMany([
    "/admin/ecosystem",
    "/admin/ecosystem/partners",
    "/admin/ecosystem/federation",
    "/admin/ecosystem/connectors",
    "/admin/ecosystem/certifications",
    "/admin/ecosystem/workflows",
    "/admin/ecosystem/governance",
    "/admin/ecosystem/analytics",
    "/admin/ecosystem/observability",
    "/admin/ecosystem/security",
    "/admin/ecosystem/compliance",
    "/admin/ecosystem/routing",
    "/admin/ecosystem/recovery",
    "/admin/ecosystem/billing",
    "/admin/ecosystem/ai",
    "/admin/ecosystem/monitoring",
  ]);
  try {
    revalidateTag(ECOSYSTEM_CACHE_TAGS.overview);
    revalidateTag(ECOSYSTEM_CACHE_TAGS.partners);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidatePlatformScope() {
  revalidateMany([
    "/admin/platform",
    "/admin/platform/plugins",
    "/admin/platform/extensions",
    "/admin/platform/sdk",
    "/admin/platform/integrations",
    "/admin/platform/marketplace",
    "/admin/platform/workflows",
    "/admin/platform/events",
    "/admin/platform/apis",
    "/admin/platform/security",
    "/admin/platform/compliance",
    "/admin/platform/observability",
    "/admin/platform/recovery",
    "/admin/platform/billing",
    "/admin/platform/governance",
    "/admin/platform/monitoring",
  ]);
  try {
    revalidateTag(PLATFORM_CACHE_TAGS.overview);
    revalidateTag(PLATFORM_CACHE_TAGS.marketplace);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateResilienceScope() {
  revalidateMany([
    "/admin/resilience",
    "/admin/resilience/chaos",
    "/admin/resilience/load-testing",
    "/admin/resilience/failover",
    "/admin/resilience/realtime",
    "/admin/resilience/queues",
    "/admin/resilience/orchestration",
    "/admin/resilience/ai",
    "/admin/resilience/tenants",
    "/admin/resilience/ecosystem",
    "/admin/resilience/recovery",
    "/admin/resilience/reliability",
    "/admin/resilience/analytics",
    "/admin/resilience/governance",
    "/admin/resilience/sla",
    "/admin/resilience/performance",
  ]);
  try {
    revalidateTag(RESILIENCE_CACHE_TAGS.overview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateGovernancePlatformScope() {
  revalidateMany([
    "/admin/governance-platform",
    "/admin/governance-platform/architecture",
    "/admin/governance-platform/adr",
    "/admin/governance-platform/documentation",
    "/admin/governance-platform/standards",
    "/admin/governance-platform/debt",
    "/admin/governance-platform/reliability",
    "/admin/governance-platform/lifecycle",
    "/admin/governance-platform/dependencies",
    "/admin/governance-platform/ai",
    "/admin/governance-platform/observability",
    "/admin/governance-platform/compliance",
    "/admin/governance-platform/quality",
    "/admin/governance-platform/analytics",
    "/admin/governance-platform/maturity",
    "/admin/governance-platform/performance",
  ]);
  try {
    revalidateTag(GOVERNANCE_PLATFORM_CACHE_TAGS.overview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateCloudScope() {
  revalidateMany([
    "/admin/cloud",
    "/admin/cloud/orchestration",
    "/admin/cloud/regions",
    "/admin/cloud/edge",
    "/admin/cloud/realtime",
    "/admin/cloud/routing",
    "/admin/cloud/analytics",
    "/admin/cloud/observability",
    "/admin/cloud/ai",
    "/admin/cloud/workloads",
    "/admin/cloud/governance",
    "/admin/cloud/recovery",
    "/admin/cloud/failover",
    "/admin/cloud/security",
    "/admin/cloud/performance",
  ]);
  try {
    revalidateTag(CLOUD_CACHE_TAGS.overview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateMultitenantScope() {
  revalidateMany([
    "/admin/multitenant",
    "/admin/multitenant/tenants",
    "/admin/multitenant/governance",
    "/admin/multitenant/analytics",
    "/admin/multitenant/cache",
    "/admin/multitenant/queues",
    "/admin/multitenant/observability",
    "/admin/multitenant/automation",
    "/admin/multitenant/sla",
    "/admin/multitenant/regions",
    "/admin/multitenant/orchestration",
    "/admin/multitenant/billing",
    "/admin/multitenant/compliance",
    "/admin/multitenant/recovery",
    "/admin/multitenant/monitoring",
  ]);
  try {
    revalidateTag(MULTITENANT_CACHE_TAGS.overview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateObservabilityScope() {
  revalidateMany([
    "/admin/observability",
    "/admin/observability/health",
    "/admin/observability/incidents",
    "/admin/observability/anomalies",
    "/admin/observability/traces",
    "/admin/observability/correlations",
    "/admin/observability/predictive",
    "/admin/observability/monitoring",
    "/admin/observability/governance",
  ]);
  try {
    revalidateTag(OBSERVABILITY_CACHE_TAGS.overview);
    revalidateTag(OBSERVABILITY_CACHE_TAGS.health);
    revalidateTag(OBSERVABILITY_CACHE_TAGS.incidents);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateComplianceScope() {
  revalidateMany([
    "/admin/compliance",
    "/admin/compliance/periods",
    "/admin/compliance/fiscal",
    "/admin/compliance/retention",
    "/admin/compliance/snapshots",
    "/admin/compliance/risks",
    "/admin/compliance/exports",
    "/admin/compliance/sod",
    "/admin/compliance/governance",
    "/admin/compliance/monitoring",
  ]);
  try {
    revalidateTag(COMPLIANCE_CACHE_TAGS.overview);
    revalidateTag(COMPLIANCE_CACHE_TAGS.periods);
    revalidateTag(COMPLIANCE_CACHE_TAGS.riskSignals);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateAutomationScope() {
  revalidateMany([
    "/admin/automation",
    "/admin/automation/workflows",
    "/admin/automation/runs",
    "/admin/automation/schedules",
    "/admin/automation/events",
    "/admin/automation/analytics",
    "/admin/automation/governance",
  ]);
  try {
    revalidateTag(AUTOMATION_CACHE_TAGS.overview);
    revalidateTag(AUTOMATION_CACHE_TAGS.workflowRuns);
    revalidateTag(AUTOMATION_CACHE_TAGS.schedules);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
  } catch {
    /* boundary Next */
  }
}

export function revalidateAdminArchivesScope() {
  revalidateMany([
    "/admin/archives",
    "/vente/clients/archives",
    "/vente/produits/archives",
    "/vente/clients",
    "/vente/produits",
  ]);
}
