import { revalidatePath, revalidateTag } from "next/cache";
import { ARCHIVES_DATA_TAG, DELETION_LOGS_TAG } from "@/lib/server/archives";
import { SHELL_PERMISSIONS_TAG } from "@/lib/server/permissions";

const REVALIDATION_MAP: Record<string, string[]> = {
  clients: [
    "/vente/clients",
    "/vente/clients/archives",
    "/vente",
    "/vente/nouvelle-vente",
    "/dashboard",
    "/dept/vente",
    "/dept",
    "/admin/archives",
  ],
  produits: [
    "/vente/produits",
    "/vente/produits/archives",
    "/vente",
    "/vente/nouvelle-vente",
    "/dashboard",
    "/dept/vente",
    "/dept",
    "/admin/archives",
  ],
  vente: [
    "/vente/historique",
    "/vente/nouvelle-vente",
    "/vente",
    "/dept/vente",
    "/vente/dashboard",
    "/dashboard",
    "/dept/vente",
    "/dept",
    "/finance",
    "/dept/finance",
  ],
  finance: [
    "/finance",
    "/finance/depenses",
    "/dept/finance",
    "/finance/dashboard",
    "/finance/visual",
    "/dashboard",
    "/dept/finance",
    "/dept",
  ],
  rh: [
    "/rh",
    "/rh/collaborateurs",
    "/rh/collaborateurs/new",
    "/rh/conges",
    "/rh/conges/new",
    "/rh/presences",
    "/rh/presences/new",
    "/rh/contrats",
    "/rh/evaluations",
    "/rh/recrutement",
    "/rh/dashboard",
    "/dashboard",
    "/dept/rh",
    "/dept",
  ],
  formation: [
    "/formation",
    "/formation/formations",
    "/formation/apprenants",
    "/formation/inscriptions",
    "/formation/certificats",
    "/formation/dashboard",
    "/dashboard",
    "/dept/formation",
    "/dept",
  ],
  consultation: [
    "/consultation",
    "/consultation/missions",
    "/consultation/agenda",
    "/consultation/clients",
    "/consultation/dashboard",
    "/dashboard",
    "/dept/consultation",
    "/dept",
  ],
  marketing: [
    "/marketing",
    "/marketing/campagnes",
    "/marketing/campagnes/new",
    "/marketing/leads",
    "/marketing/leads/new",
    "/marketing/analytics",
    "/marketing/dashboard",
    "/dashboard",
    "/dept/marketing",
    "/dept",
    "/vente/clients",
  ],
  logistique: [
    "/logistique",
    "/logistique/articles",
    "/logistique/articles/new",
    "/logistique/mouvements",
    "/logistique/mouvements/new",
    "/logistique/fournisseurs",
    "/logistique/fournisseurs/new",
    "/logistique/achats",
    "/logistique/achats/new",
    "/logistique/stock",
    "/logistique/dashboard",
    "/logistique/visual",
    "/dashboard",
    "/dept/logistique",
    "/dept",
  ],
  operations: [
    "/operations",
    "/operations/tasks",
    "/operations/projects",
    "/operations/workflows",
    "/operations/delivery",
    "/operations/reporting",
    "/operations/dashboard",
    "/dashboard",
    "/dept/consultation",
    "/dept",
  ],
  utilisateurs: [
    "/settings/users",
    "/settings",
    "/admin",
    "/admin/users",
  ],
  activity_logs: [
    "/admin/activity-logs",
    "/actions/journaux",
    "/actions",
    "/dashboard",
  ],
  settings: ["/settings", "/dashboard"],
  admin_alerts: ["/admin/alerts", "/admin", "/dashboard"],
  admin_approvals: [
    "/admin/approvals",
    "/admin",
    "/dashboard",
    "/rh/contrats",
    "/rh/recrutement",
  ],
  crm: [
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
    "/vente/crm/visual",
    "/dashboard",
    "/dept/vente",
    "/dept",
  ],
  admin_ai: [
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
    "/admin",
  ],
  admin_automation: [
    "/admin/automation",
    "/admin/automation/workflows",
    "/admin/automation/runs",
    "/admin/automation/schedules",
    "/admin/automation/events",
    "/admin/automation/analytics",
    "/admin/automation/governance",
    "/admin",
  ],
  admin_compliance: [
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
    "/admin",
  ],
  admin_ecosystem: [
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
    "/admin",
  ],
  admin_platform: [
    "/admin/platform",
    "/admin/platform/plugins",
    "/admin/platform/extensions",
    "/admin/platform/integrations",
    "/admin/platform/connectors",
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
    "/admin/platform-dashboard",
    "/admin",
  ],
  admin_cloud: [
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
    "/admin",
  ],
  admin_multitenant: [
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
    "/admin",
  ],
  admin_observability: [
    "/admin/observability",
    "/admin/observability/health",
    "/admin/observability/incidents",
    "/admin/observability/anomalies",
    "/admin/observability/traces",
    "/admin/observability/correlations",
    "/admin/observability/predictive",
    "/admin/observability/monitoring",
    "/admin/observability/governance",
    "/admin",
  ],
  admin_resilience: [
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
    "/admin",
  ],
  admin_governance_platform: [
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
    "/admin",
  ],
  dashboard_foundation: ["/dashboard", "/dept", "/dashboard/executive"],
};

function uniq(paths: readonly string[]): string[] {
  return Array.from(new Set(paths.map((p) => p.trim()).filter(Boolean)));
}

async function applyRevalidation(paths: readonly string[]): Promise<void> {
  for (const path of uniq(paths)) {
    revalidatePath(path);
  }
}

export async function revalidateExtraPaths(...paths: Array<string | null | undefined>): Promise<void> {
  await applyRevalidation(paths.filter(Boolean) as string[]);
}

export async function revalidateModules(...moduleKeys: string[]): Promise<void> {
  const pathsToRevalidate = new Set<string>();

  for (const key of moduleKeys) {
    for (const path of REVALIDATION_MAP[key] ?? []) {
      pathsToRevalidate.add(path);
    }
  }

  await applyRevalidation(Array.from(pathsToRevalidate));
  revalidatePath("/", "layout");
}

export async function revalidateClients(options?: { clientId?: string | null }): Promise<void> {
  await revalidateModules("clients", "activity_logs");
  await revalidateExtraPaths(options?.clientId ? `/vente/clients/${options.clientId}` : undefined);
}

export async function revalidateProduits(options?: { productId?: string | null }): Promise<void> {
  await revalidateModules("produits", "activity_logs");
  await revalidateExtraPaths(options?.productId ? `/vente/produits/${options.productId}` : undefined);
}

export async function revalidateVente(options?: { saleId?: string | null }): Promise<void> {
  await revalidateModules("vente", "clients", "produits", "finance", "activity_logs");
  await revalidateExtraPaths(options?.saleId ? `/vente/historique/${options.saleId}` : undefined);
}

export async function revalidateFinance(): Promise<void> {
  await revalidateModules("finance", "activity_logs");
}

export async function revalidateRH(): Promise<void> {
  await revalidateModules("rh", "activity_logs");
}

export async function revalidateFormation(): Promise<void> {
  await revalidateModules("formation", "activity_logs");
}

export async function revalidateConsultation(): Promise<void> {
  await revalidateModules("consultation", "activity_logs");
}

export async function revalidateMarketing(): Promise<void> {
  await revalidateModules("marketing", "activity_logs");
}

export async function revalidateLogistique(): Promise<void> {
  await revalidateModules("logistique", "activity_logs");
}

export async function revalidateOperations(): Promise<void> {
  await revalidateModules("operations", "consultation", "activity_logs");
}

export async function revalidateUtilisateurs(): Promise<void> {
  await revalidateModules("utilisateurs", "activity_logs");
}

export async function revalidateSettings(): Promise<void> {
  await revalidateModules("settings");
  revalidateShellPermissions();
}

export async function revalidateAdminAlerts(): Promise<void> {
  await revalidateModules("admin_alerts");
}

export async function revalidateAdminApprovals(): Promise<void> {
  await revalidateModules("admin_approvals", "rh", "activity_logs");
}

export async function revalidateCrm(): Promise<void> {
  await revalidateModules("crm", "clients", "vente", "activity_logs");
}

export async function revalidateAdminArchives(): Promise<void> {
  await revalidateModules("clients", "produits", "finance");
  revalidateTag(ARCHIVES_DATA_TAG);
  revalidateTag(DELETION_LOGS_TAG);
}

export function revalidateShellPermissions(): void {
  revalidateTag(SHELL_PERMISSIONS_TAG);
}

export async function revalidateDashboardFoundation(deptKeys?: readonly string[]): Promise<void> {
  const extra = (deptKeys ?? []).map((k) => `/dept/${String(k).trim().toLowerCase()}`);
  await revalidateModules("dashboard_foundation");
  await revalidateExtraPaths(...extra);
}

export async function revalidateAdminAi(): Promise<void> {
  await revalidateModules("admin_ai");
}

export async function revalidateAdminAutomation(): Promise<void> {
  await revalidateModules("admin_automation");
}

export async function revalidateAdminCompliance(): Promise<void> {
  await revalidateModules("admin_compliance");
}

export async function revalidateAdminEcosystem(): Promise<void> {
  await revalidateModules("admin_ecosystem");
}

export async function revalidateAdminPlatform(): Promise<void> {
  await revalidateModules("admin_platform");
}

export async function revalidateAdminCloud(): Promise<void> {
  await revalidateModules("admin_cloud");
}

export async function revalidateAdminMultitenant(): Promise<void> {
  await revalidateModules("admin_multitenant");
}

export async function revalidateAdminObservability(): Promise<void> {
  await revalidateModules("admin_observability");
}

export async function revalidateAdminResilience(): Promise<void> {
  await revalidateModules("admin_resilience");
}

export async function revalidateAdminGovernancePlatform(): Promise<void> {
  await revalidateModules("admin_governance_platform");
}

export async function revalidateDepartmentDashboard(deptKey: string): Promise<void> {
  const k = String(deptKey ?? "").trim().toLowerCase();
  await revalidateModules("dashboard_foundation");
  await revalidateExtraPaths(`/dept/${k}`);
}

export async function revalidateExecutiveDashboard(): Promise<void> {
  await revalidateModules("dashboard_foundation");
}

export async function revalidateHrVisualDashboard(): Promise<void> {
  await revalidateModules("rh", "dashboard_foundation");
}

export async function revalidateFinanceVisualDashboard(): Promise<void> {
  await revalidateModules("finance", "dashboard_foundation");
}

export async function revalidateCrmVisualDashboard(): Promise<void> {
  await revalidateModules("crm", "dashboard_foundation");
}

export async function revalidateLogisticsVisualDashboard(): Promise<void> {
  await revalidateModules("logistique", "dashboard_foundation");
}
