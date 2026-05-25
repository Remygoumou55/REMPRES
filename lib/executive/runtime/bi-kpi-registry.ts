/**
 * ONE KPI TRUTH — registre canonique (miroir seed SQL + runtime).
 */
export const BI_KPI_REGISTRY_VERSION = "bi-kpi-registry-bloc3-v1" as const;

export type BiKpiDefinition = {
  kpiKey: string;
  label: string;
  domainKey: string;
  sourceEntity: string;
  sourceMetric: string;
  unit: "count" | "currency" | "percent";
  ownerRole: string;
  warningThreshold: number | null;
  criticalThreshold: number | null;
};

export const BI_KPI_REGISTRY: readonly BiKpiDefinition[] = [
  {
    kpiKey: "company.revenue_month",
    label: "Revenus mensuels",
    domainKey: "finance",
    sourceEntity: "sales",
    sourceMetric: "sum_total_amount_gnf",
    unit: "currency",
    ownerRole: "finance",
    warningThreshold: null,
    criticalThreshold: null,
  },
  {
    kpiKey: "company.expenses_month",
    label: "Dépenses mensuelles",
    domainKey: "finance",
    sourceEntity: "expenses",
    sourceMetric: "sum_amount_gnf",
    unit: "currency",
    ownerRole: "finance",
    warningThreshold: null,
    criticalThreshold: null,
  },
  {
    kpiKey: "company.net_margin",
    label: "Marge nette",
    domainKey: "finance",
    sourceEntity: "computed",
    sourceMetric: "revenue_minus_expenses",
    unit: "currency",
    ownerRole: "executive",
    warningThreshold: 0,
    criticalThreshold: null,
  },
  {
    kpiKey: "crm.pipeline_open",
    label: "Pipeline ouvert",
    domainKey: "vente",
    sourceEntity: "crm_opportunities",
    sourceMetric: "count_active",
    unit: "count",
    ownerRole: "vente",
    warningThreshold: null,
    criticalThreshold: null,
  },
  {
    kpiKey: "ops.tasks_backlog",
    label: "Backlog tâches",
    domainKey: "consultation",
    sourceEntity: "erp_ops_tasks",
    sourceMetric: "count_open",
    unit: "count",
    ownerRole: "operations",
    warningThreshold: 10,
    criticalThreshold: 25,
  },
  {
    kpiKey: "governance.approvals_pending",
    label: "Approbations en attente",
    domainKey: "platform",
    sourceEntity: "approval_requests",
    sourceMetric: "count_pending",
    unit: "count",
    ownerRole: "governance",
    warningThreshold: 5,
    criticalThreshold: 15,
  },
  {
    kpiKey: "observability.incidents_open",
    label: "Incidents ouverts",
    domainKey: "platform",
    sourceEntity: "erp_observability_incidents",
    sourceMetric: "count_open",
    unit: "count",
    ownerRole: "observability",
    warningThreshold: 3,
    criticalThreshold: 10,
  },
] as const;

export function getBiKpiDefinition(kpiKey: string): BiKpiDefinition | undefined {
  return BI_KPI_REGISTRY.find((k) => k.kpiKey === kpiKey);
}
