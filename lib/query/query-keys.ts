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
  dashboard: {
    global: ["dashboard", "global"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
