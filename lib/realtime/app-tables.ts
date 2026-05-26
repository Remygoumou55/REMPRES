import { queryKeys } from "@/lib/query/query-keys";

/** Racines React Query à invalider sur tout changement dashboard / shell. */
export const APP_GLOBAL_QUERY_SCOPES = [
  queryKeys.dashboard.global,
  queryKeys.dashboard.foundation.root,
  queryKeys.executive.root,
  queryKeys.executive.globalSnapshot,
  queryKeys.departmentDashboards.root,
  queryKeys.dept.root,
  queryKeys.admin.supervision,
] as const;

/** Tables métier suivies par le pont realtime global (schéma public). */
export const APP_REALTIME_TABLE_SCOPES: Record<string, readonly (readonly string[])[]> = {
  // ── Vente ─────────────────────────────────────────────────────────────────
  clients: [
    queryKeys.vente.clients,
    queryKeys.vente.root,
    queryKeys.crm.root,
    queryKeys.marketing.root,
  ],
  products: [queryKeys.vente.products, queryKeys.vente.root],
  sales: [queryKeys.vente.sales, queryKeys.vente.kpis, queryKeys.vente.root, queryKeys.finance.root],
  sale_items: [queryKeys.vente.sales, queryKeys.vente.root, queryKeys.finance.root],

  // ── Finance ───────────────────────────────────────────────────────────────
  expenses: [queryKeys.finance.expenses, queryKeys.finance.kpis, queryKeys.finance.root],

  // ── RH ────────────────────────────────────────────────────────────────────
  employees: [queryKeys.rh.employees, queryKeys.rh.root, queryKeys.rh.dashboard],
  rh_employee_contracts: [queryKeys.rh.contracts, queryKeys.rh.root, queryKeys.rh.dashboard],
  rh_contract_documents: [queryKeys.rh.contracts, queryKeys.rh.root],
  rh_contract_history: [queryKeys.rh.contracts, queryKeys.rh.root],
  rh_employee_documents: [queryKeys.rh.employees, queryKeys.rh.root],
  rh_employee_history: [queryKeys.rh.employees, queryKeys.rh.root],
  rh_employee_hierarchy: [queryKeys.rh.employees, queryKeys.rh.root],
  rh_leave_requests: [queryKeys.rh.leaves, queryKeys.rh.root, queryKeys.rh.dashboard],
  rh_attendance_events: [queryKeys.rh.attendance, queryKeys.rh.root, queryKeys.rh.dashboard],
  rh_recruitment_candidates: [queryKeys.rh.recruitment, queryKeys.rh.root],
  rh_recruitment_interviews: [queryKeys.rh.recruitment, queryKeys.rh.root],
  approval_requests: [
    queryKeys.rh.approvals,
    queryKeys.rh.root,
    queryKeys.admin.supervision,
    queryKeys.vente.root,
    queryKeys.vente.clients,
    queryKeys.vente.products,
    queryKeys.vente.sales,
  ],

  // ── Formation & consultation ─────────────────────────────────────────────
  trainings: [queryKeys.formation.root],
  training_sessions: [queryKeys.formation.root],
  trainees: [queryKeys.formation.root],
  enrollments: [queryKeys.formation.root],
  certificates: [queryKeys.formation.root],
  missions: [queryKeys.consultation.root, queryKeys.formation.root],
  deliverables: [queryKeys.consultation.root],
  appointments: [queryKeys.consultation.root],

  // ── Marketing ─────────────────────────────────────────────────────────────
  campaigns: [queryKeys.marketing.campaigns, queryKeys.marketing.root],
  leads: [queryKeys.marketing.leads, queryKeys.marketing.root, queryKeys.crm.leads],

  // ── Logistique ────────────────────────────────────────────────────────────
  stock_items: [
    queryKeys.logistics.stock,
    queryKeys.logistics.root,
    queryKeys.vente.products,
  ],
  stock_movements_logistique: [
    queryKeys.logistics.movements,
    queryKeys.logistics.stock,
    queryKeys.logistics.root,
  ],
  logistics_suppliers: [queryKeys.logistics.suppliers, queryKeys.logistics.root],
  logistics_warehouses: [queryKeys.logistics.warehouses, queryKeys.logistics.root],
  simple_purchase_orders: [
    queryKeys.logistics.purchaseOrders,
    queryKeys.logistics.root,
  ],

  // ── Gouvernance & journaux ───────────────────────────────────────────────
  governance_alerts: [queryKeys.rh.alerts, queryKeys.admin.supervision],
  activity_logs: [queryKeys.admin.activityLogs, queryKeys.admin.root],
  notifications: [queryKeys.admin.supervision],

  // ── Utilisateurs ──────────────────────────────────────────────────────────
  profiles: [queryKeys.admin.users, queryKeys.admin.root],
};

/** Liste ordonnée des tables pour abonnement Supabase (dédupliquée). */
export const APP_REALTIME_WATCHED_TABLES = Object.keys(APP_REALTIME_TABLE_SCOPES);

/**
 * Modules ERP (clés revalidation-map) → racines React Query.
 * Utilisé après mutations serveur côté client.
 */
export const MODULE_QUERY_SCOPES: Record<string, readonly (readonly string[])[]> = {
  clients: APP_REALTIME_TABLE_SCOPES.clients,
  produits: APP_REALTIME_TABLE_SCOPES.products,
  vente: [
    ...APP_REALTIME_TABLE_SCOPES.sales,
    queryKeys.vente.kpis,
    queryKeys.finance.kpis,
  ],
  finance: APP_REALTIME_TABLE_SCOPES.expenses,
  rh: [
    queryKeys.rh.root,
    queryKeys.rh.dashboard,
    queryKeys.rh.employees,
    queryKeys.rh.contracts,
    queryKeys.rh.leaves,
    queryKeys.rh.attendance,
    queryKeys.rh.recruitment,
  ],
  formation: [queryKeys.formation.root],
  consultation: [queryKeys.consultation.root, queryKeys.formation.root],
  marketing: [queryKeys.marketing.root, queryKeys.marketing.campaigns, queryKeys.marketing.leads],
  logistique: [queryKeys.logistics.root],
  operations: [queryKeys.consultation.root],
  utilisateurs: APP_REALTIME_TABLE_SCOPES.profiles,
  activity_logs: APP_REALTIME_TABLE_SCOPES.activity_logs,
  admin_alerts: APP_REALTIME_TABLE_SCOPES.governance_alerts,
  admin_approvals: APP_REALTIME_TABLE_SCOPES.approval_requests,
  crm: [queryKeys.crm.root],
  dashboard_foundation: [...APP_GLOBAL_QUERY_SCOPES],
};
