/**
 * Clés de cache/query centralisées par domaine ERP.
 * Source unique pour React Query + cache local + invalidation ciblée.
 */

type Id = string | number;

function clean(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function sorted(values: readonly string[]): readonly string[] {
  return [...values].filter(Boolean).sort();
}

export const queryKeys = {
  dept: {
    root: ["dept"] as const,
    kpis: (deptKey: string) => ["dept", "kpis", clean(deptKey)] as const,
  },
  vente: {
    root: ["vente"] as const,
    clients: ["vente", "clients"] as const,
    clientById: (id: Id) => ["vente", "clients", String(id)] as const,
    products: ["vente", "products"] as const,
    productById: (id: Id) => ["vente", "products", String(id)] as const,
    sales: ["vente", "sales"] as const,
    saleById: (id: Id) => ["vente", "sales", String(id)] as const,
    kpis: ["vente", "kpis"] as const,
    archives: ["vente", "archives"] as const,
  },
  finance: {
    root: ["finance"] as const,
    expenses: ["finance", "expenses"] as const,
    expenseById: (id: Id) => ["finance", "expenses", String(id)] as const,
    kpis: ["finance", "kpis"] as const,
    snapshot: (params: {
      from: string;
      to: string;
      categoryIds: readonly string[];
      createdBy: string | null;
    }) =>
      [
        "finance",
        "snapshot",
        clean(params.from),
        clean(params.to),
        sorted(params.categoryIds).join(","),
        clean(params.createdBy),
      ] as const,
    exports: ["finance", "exports"] as const,
    accountingAccounts: ["finance", "enterprise", "accounts"] as const,
    journalBatches: ["finance", "enterprise", "journal_batches"] as const,
    arInvoices: ["finance", "enterprise", "ar_invoices"] as const,
    budgets: ["finance", "enterprise", "budgets"] as const,
    cashflowDaily: (from: string, to: string) =>
      ["finance", "enterprise", "cashflow_daily", clean(from), clean(to)] as const,
    enterpriseHub: ["finance", "enterprise"] as const,
  },
  admin: {
    root: ["admin"] as const,
    users: ["admin", "users"] as const,
    activityLogs: ["admin", "activityLogs"] as const,
    archives: ["admin", "archives"] as const,
    supervision: ["admin", "supervision"] as const,
  },
  rh: {
    root: ["rh"] as const,
    employees: ["rh", "employees"] as const,
    contracts: ["rh", "contracts"] as const,
    contractById: (id: Id) => ["rh", "contracts", String(id)] as const,
    contractDocuments: (contractId: Id) => ["rh", "contracts", String(contractId), "documents"] as const,
    contractHistory: (contractId: Id) => ["rh", "contracts", String(contractId), "history"] as const,
    contractReporting: ["rh", "contracts", "reporting"] as const,
    recruitment: ["rh", "recruitment"] as const,
    recruitmentCandidate: (id: Id) => ["rh", "recruitment", String(id)] as const,
    recruitmentExport: ["rh", "recruitment", "export"] as const,
    recruitmentReporting: ["rh", "recruitment", "reporting"] as const,
    dashboard: ["rh", "dashboard"] as const,
    approvals: ["rh", "approvals"] as const,
    alerts: ["rh", "alerts"] as const,
    leaves: ["rh", "leaves"] as const,
    attendance: ["rh", "attendance"] as const,
  },
  formation: {
    root: ["formation"] as const,
  },
  consultation: {
    root: ["consultation"] as const,
  },
  crm: {
    root: ["crm"] as const,
    hub: ["crm", "hub"] as const,
    leads: ["crm", "leads"] as const,
    opportunities: ["crm", "opportunities"] as const,
    quotes: ["crm", "quotes"] as const,
    activities: ["crm", "activities"] as const,
    pipeline: ["crm", "pipeline"] as const,
    forecasting: ["crm", "forecasting"] as const,
  },
  logistics: {
    root: ["logistics"] as const,
    hub: ["logistics", "hub"] as const,
    warehouses: ["logistics", "warehouses"] as const,
    stock: ["logistics", "stock"] as const,
    movements: ["logistics", "movements"] as const,
    suppliers: ["logistics", "suppliers"] as const,
    purchaseOrders: ["logistics", "purchase_orders"] as const,
    deliveries: ["logistics", "deliveries"] as const,
    alerts: ["logistics", "alerts"] as const,
  },
  dashboard: {
    global: ["dashboard", "global"] as const,
    foundation: {
      root: ["dashboard", "foundation"] as const,
      dept: (deptKey: string) => ["dashboard", "foundation", "dept", clean(deptKey)] as const,
      orchestration: (id: string) => ["dashboard", "foundation", "orchestration", clean(id)] as const,
    },
  },
  analytics: {
    root: ["analytics"] as const,
    rhDeptKpis: ["analytics", "rh", "dept-kpis"] as const,
    rhFoundation: ["analytics", "rh", "foundation"] as const,
  },
  infrastructure: {
    root: ["infrastructure"] as const,
    jobs: ["infrastructure", "jobs"] as const,
    jobBatch: (batchId: string) => ["infrastructure", "jobs", "batch", clean(batchId)] as const,
  },
  automation: {
    root: ["automation"] as const,
    hub: ["automation", "hub"] as const,
    workflows: ["automation", "workflows"] as const,
    runs: ["automation", "runs"] as const,
    schedules: ["automation", "schedules"] as const,
    events: ["automation", "events"] as const,
  },
  compliance: {
    root: ["compliance"] as const,
    hub: ["compliance", "hub"] as const,
    periods: ["compliance", "periods"] as const,
    fiscal: ["compliance", "fiscal"] as const,
    retention: ["compliance", "retention"] as const,
    risks: ["compliance", "risks"] as const,
  },
  observability: {
    root: ["observability"] as const,
    hub: ["observability", "hub"] as const,
    health: ["observability", "health"] as const,
    incidents: ["observability", "incidents"] as const,
    anomalies: ["observability", "anomalies"] as const,
    traces: ["observability", "traces"] as const,
  },
  ai: {
    root: ["ai"] as const,
    hub: ["ai", "hub"] as const,
    insights: ["ai", "insights"] as const,
    recommendations: ["ai", "recommendations"] as const,
    pipelines: ["ai", "pipelines"] as const,
  },
  multitenant: {
    root: ["multitenant"] as const,
    hub: ["multitenant", "hub"] as const,
    tenants: ["multitenant", "tenants"] as const,
    memberships: (tenantId: Id) => ["multitenant", "memberships", String(tenantId)] as const,
  },
  platform: {
    root: ["platform"] as const,
    hub: ["platform", "hub"] as const,
    marketplace: ["platform", "marketplace"] as const,
    catalog: ["platform", "catalog"] as const,
    installations: ["platform", "installations"] as const,
  },
  ecosystem: {
    root: ["ecosystem"] as const,
    hub: ["ecosystem", "hub"] as const,
    partners: ["ecosystem", "partners"] as const,
    federation: ["ecosystem", "federation"] as const,
  },
  cloud: {
    root: ["cloud"] as const,
    hub: ["cloud", "hub"] as const,
    regions: ["cloud", "regions"] as const,
    operations: ["cloud", "operations"] as const,
  },
  governancePlatform: {
    root: ["governance_platform"] as const,
    hub: ["governance_platform", "hub"] as const,
    adr: ["governance_platform", "adr"] as const,
    maturity: ["governance_platform", "maturity"] as const,
  },
  resilience: {
    root: ["resilience"] as const,
    hub: ["resilience", "hub"] as const,
    chaos: ["resilience", "chaos"] as const,
    validation: ["resilience", "validation"] as const,
  },
  executive: {
    root: ["executive"] as const,
    globalSnapshot: ["executive", "global-snapshot"] as const,
  },
  adminPlatform: {
    root: ["admin_platform"] as const,
    hub: ["admin_platform", "hub"] as const,
  },
  departmentDashboards: {
    root: ["department_dashboards"] as const,
    dept: (deptKey: string) => ["department_dashboards", "dept", clean(deptKey)] as const,
    hrVisual: ["department_dashboards", "hr", "visual"] as const,
    financeVisual: ["department_dashboards", "finance", "visual"] as const,
    crmVisual: ["department_dashboards", "crm", "visual"] as const,
    logisticsVisual: ["department_dashboards", "logistics", "visual"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
